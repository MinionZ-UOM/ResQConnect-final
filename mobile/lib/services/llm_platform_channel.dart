import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';

import 'metrics_recorder.dart';

class LlmPlatformChannel {
  static const MethodChannel _channel = MethodChannel('llm_inference');

  static final StreamController<Map<String, dynamic>> _progressController = StreamController.broadcast();
  static bool _initialized = false;

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

  static Future<String> generateResponse(String prompt) async {
    final stopwatch = Stopwatch()..start();
    final int memoryBeforeBytes = ProcessInfo.currentRss;
    String response = '';
    bool success = false;
    String? errorMessage;

    try {
      response = await _channel.invokeMethod('generateResponse', {'prompt': prompt});
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
}
