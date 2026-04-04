import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';

import 'metrics_recorder.dart';

class LlmPlatformChannel {
  static const MethodChannel _channel = MethodChannel('llm_inference');

  static final StreamController<Map<String, dynamic>> _downloadProgressController = StreamController.broadcast();
  static final StreamController<Map<String, dynamic>> _inferenceProgressController = StreamController.broadcast();
  static bool _initialized = false;

  static void _initProgressListener() {
    if (_initialized) return;
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'downloadProgress') {
        final Map<dynamic, dynamic> args = call.arguments;
        _downloadProgressController.add({
          'downloaded': args['downloaded'] as int,
          'total': args['total'] as int,
        });
      } else if (call.method == 'inferenceProgress') {
        final Map<dynamic, dynamic> args = call.arguments;
        _inferenceProgressController.add({
          'text': (args['text'] as String?) ?? '',
          'done': (args['done'] as bool?) ?? false,
        });
      }
    });
    _initialized = true;
  }

  static Stream<Map<String, dynamic>> get downloadProgress {
    _initProgressListener();
    return _downloadProgressController.stream;
  }

  static Stream<Map<String, dynamic>> get inferenceProgress {
    _initProgressListener();
    return _inferenceProgressController.stream;
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

  static Future<String> generateResponse(String prompt) async {
    _initProgressListener();
    final stopwatch = Stopwatch()..start();
    final int memoryBeforeBytes = ProcessInfo.currentRss;
    String response = '';
    bool success = false;
    String? errorMessage;

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
