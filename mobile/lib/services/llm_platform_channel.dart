import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';

import 'metrics_recorder.dart';

class LlmPlatformChannel {
  static const MethodChannel _channel = MethodChannel('llm_inference');
  static const EventChannel _streamChannel = EventChannel('llm_inference_stream');

  static final StreamController<Map<String, dynamic>> _progressController = StreamController.broadcast();
  static final StreamController<String> _responseController = StreamController.broadcast();

  static StreamSubscription? _streamSubscription;
  static bool _initialized = false;
  static String _pendingFragment = '';
  static int _firstTokenLatencyMs = 0;

  static void _initProgressListener() {
    if (_initialized) return;
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'downloadProgress') {
        final Map<dynamic, dynamic> args = call.arguments;
        _progressController.add({
          'downloaded': args['downloaded'] as int,
          'total': args['total'] as int,
        });
      }
    });
    _initialized = true;
  }

  static void _initResponseStreamListener() {
    if (_streamSubscription != null) return;

    _firstTokenLatencyMs = 0;
    _streamSubscription = _streamChannel.receiveBroadcastStream().listen(
      (event) {
        print('DEBUG: Stream event received: $event');
        if (event is Map) {
          final text = (event['text'] as String?) ?? '';
          final done = (event['done'] as bool?) ?? false;
          final firstTokenLatency = (event['firstTokenLatencyMs'] as int?) ?? 0;
          
          // Capture first token latency (only set once)
          if (firstTokenLatency > 0 && _firstTokenLatencyMs == 0) {
            _firstTokenLatencyMs = firstTokenLatency;
            print('DEBUG: First token latency captured: $_firstTokenLatencyMs ms');
          }
          
          print('DEBUG: Processing chunk - text: "$text", done: $done');
          _processStreamChunk(text, done);
        } else if (event is String) {
          print('DEBUG: Processing string chunk: "$event"');
          _processStreamChunk(event, false);
        }
      },
      onError: (error) {
        print('DEBUG: Stream error: $error');
        // Forward errors to the stream consumers as a final message.
        _responseController.add('Error: $error');
      },
      cancelOnError: true,
    );
    _streamSubscription?.onDone(() {
      print('DEBUG: Stream done');
      _streamSubscription = null;
    });
  }

  static void _processStreamChunk(String chunk, bool done) {
    // The stream can emit partial text without whitespace at the end (e.g., "Hello" then " world").
    // The previous implementation buffered until whitespace was received, which caused the UI to
    // show nothing until the full response arrived.
    print('DEBUG: _processStreamChunk called - chunk: "$chunk", done: $done');
    if (chunk.isEmpty && !done) return;

    final cleaned = _cleanChunk(chunk);
    print('DEBUG: Cleaned chunk: "$cleaned"');

    // Emit chunks as they arrive to enable true streaming in the UI.
    if (cleaned.isNotEmpty) {
      _responseController.add(cleaned);
    }

    if (done) {
      print('DEBUG: Emitting [DONE] marker');
      _responseController.add('[DONE]');
    }
  }

  static String _cleanChunk(String chunk) {
    // Similar to _cleanResponse but optimized for streaming chunks.
    // IMPORTANT: Do NOT trim individual chunks - we need spaces as word boundaries!
    return chunk
        // Remove special tokens: <|xxx|>, <xxx|>, <[xxx|>, etc.
        .replaceAll(RegExp(r'<[|\[\w_]*[|>\]]*>'), '')
        .replaceAll(RegExp(r'<[a-z_]*\|?'), '')
        .replaceAll(RegExp(r'\|>'), '')
        // Remove common artifact tags
        .replaceAll(RegExp(r'<source.*?>', caseSensitive: false), '')
        .replaceAll(RegExp(r'<lim_.*?>', caseSensitive: false), '')
        .replaceAll(RegExp(r'<im_.*?>', caseSensitive: false), '')
        // Remove system prompts and generic assistant markers
        .replaceAll('You are a helpful assistant.', '')
        .replaceAll('assistant', '')
        // Normalize whitespace (but preserve word boundaries)
        .replaceAll(RegExp(r' +'), ' ')
        // Don't trim here - preserve leading/trailing spaces as word boundaries!
        ;
  }

  static Stream<Map<String, dynamic>> get downloadProgress {
    _initProgressListener();
    return _progressController.stream;
  }

  static Future<bool> downloadModel() async {
    try {
      return await _channel.invokeMethod('downloadModel');
    } catch (_) {
      return false;
    }
  }

  static Future<bool> isModelDownloaded() async {
    try {
      return await _channel.invokeMethod('isModelDownloaded');
    } catch (_) {
      return false;
    }
  }

  static Stream<String> get responseStream {
    _initResponseStreamListener();
    return _responseController.stream;
  }

  static Future<String> generateResponse(String prompt) async {
    final stopwatch = Stopwatch()..start();
    final int memoryBeforeBytes = ProcessInfo.currentRss;
    String response = '';
    bool success = false;
    String? errorMessage;

    // CRITICAL: Set up the stream listener FIRST, before calling the method
    // This prevents race conditions where events are sent before Flutter is listening
    _initResponseStreamListener();
    
    // Give the stream listener a moment to be fully established
    await Future.delayed(const Duration(milliseconds: 50));

    try {
      response = await _channel.invokeMethod('generateResponse', {'prompt': prompt});
      // Clean up the response
      response = _cleanResponse(response);
      success = true;
      return response;
    } catch (error) {
      errorMessage = error.toString();
      return errorMessage;
    } finally {
      stopwatch.stop();
      final int memoryAfterBytes = ProcessInfo.currentRss;
      final int promptWordCount = _countWords(prompt);
      final int responseWordCount = _countWords(response);
      final double latencySeconds = stopwatch.elapsedMilliseconds == 0
          ? 0
          : stopwatch.elapsedMilliseconds / 1000;
      final double responseCharsPerSecond = latencySeconds == 0
          ? 0
          : response.length / latencySeconds;
      final double responseWordsPerSecond = latencySeconds == 0
          ? 0
          : responseWordCount / latencySeconds;
      final double promptToResponseRatio = prompt.isEmpty
          ? 0
          : response.length / prompt.length;
      final metric = MetricEntry(
        timestamp: DateTime.now(),
        latencyMs: stopwatch.elapsedMilliseconds,
        memoryBeforeBytes: memoryBeforeBytes,
        memoryAfterBytes: memoryAfterBytes,
        promptLength: prompt.length,
        responseLength: response.length,
        success: success,
        errorMessage: errorMessage,
        promptWordCount: promptWordCount,
        responseWordCount: responseWordCount,
        responseCharsPerSecond: responseCharsPerSecond,
        responseWordsPerSecond: responseWordsPerSecond,
        promptToResponseRatio: promptToResponseRatio,
        firstTokenLatencyMs: _firstTokenLatencyMs,
      );
      await MetricsRecorder.instance.recordEntry(metric);
    }
  }

  static int _countWords(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return 0;
    }
    return trimmed.split(RegExp(r'\s+')).length;
  }

  static String _cleanResponse(String response) {
    // Remove all special tokens and artifacts
    var cleaned = response
        // Remove special tokens: <|xxx|>, <xxx|>, <[xxx|>, etc.
        .replaceAll(RegExp(r'<[|\[\w_]*[|>\]]*>'), '')
        .replaceAll(RegExp(r'<[a-z_]*\|?'), '')
        .replaceAll(RegExp(r'\|>'), '')
        // Remove common artifact tags
        .replaceAll(RegExp(r'<source.*?>', caseSensitive: false), '')
        .replaceAll(RegExp(r'<lim_.*?>', caseSensitive: false), '')
        .replaceAll(RegExp(r'<im_.*?>', caseSensitive: false), '')
        // Remove system prompts
        .replaceAll('You are a helpful assistant.', '')
        .replaceAll('assistant', '')
        // Clean up whitespace
        .replaceAll(RegExp(r'\n\s*\n'), '\n')
        .replaceAll(RegExp(r'  +'), ' ')
        .trim();

    // Extract only the first coherent response (stop at question marks that indicate new queries)
    final sentences = cleaned.split(RegExp(r'(?<=[.!?])\s+'));
    
    // Take first 2-3 sentences or until we hit a question that looks like new prompt
    List<String> result = [];
    for (var sentence in sentences) {
      if (sentence.isEmpty) continue;
      
      // Stop if we hit common prompt patterns (new questions from the conversation)
      if (sentence.toLowerCase().contains('what should i do') ||
          sentence.toLowerCase().contains('how do i') ||
          sentence.toLowerCase().contains('should i')) {
        break;
      }
      
      result.add(sentence);
      
      // Limit to 3 sentences to avoid too long responses
      if (result.length >= 3) break;
    }

    return result.join(' ').trim();
  }
}
