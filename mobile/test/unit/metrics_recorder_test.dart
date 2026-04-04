import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:resqconnect_edge_app/services/metrics_recorder.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const MethodChannel pathProviderChannel = MethodChannel('plugins.flutter.io/path_provider');
  late final Directory tempDir;
  final recorder = MetricsRecorder.instance;

  setUpAll(() async {
    tempDir = await Directory.systemTemp.createTemp('resq_metrics_tests_');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(pathProviderChannel, (MethodCall call) async {
      switch (call.method) {
        case 'getApplicationDocumentsDirectory':
        case 'getApplicationDocumentsPath':
        case 'getDownloadsDirectory':
        case 'getDownloadsPath':
          return tempDir.path;
        default:
          return tempDir.path;
      }
    });
  });

  setUp(() async {
    await recorder.ensureInitialized();
    await recorder.clear();
  });

  tearDownAll(() async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(pathProviderChannel, null);
    if (await tempDir.exists()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('recordEntry persists a metric in JSON storage', () async {
    final entry = MetricEntry(
      timestamp: DateTime.now(),
      latencyMs: 1200,
      memoryBeforeBytes: 1000,
      memoryAfterBytes: 1300,
      promptLength: 20,
      responseLength: 40,
      success: true,
      promptWordCount: 4,
      responseWordCount: 8,
      responseCharsPerSecond: 33.3,
      responseWordsPerSecond: 6.6,
      promptToResponseRatio: 2.0,
    );

    await recorder.recordEntry(entry);

    final jsonFile = File('${tempDir.path}${Platform.pathSeparator}llm_metrics.json');
    final raw = await jsonFile.readAsString();
    final decoded = jsonDecode(raw) as List<dynamic>;

    expect(recorder.entries, hasLength(1));
    expect(await jsonFile.exists(), isTrue);
    expect(decoded, hasLength(1));
    expect((decoded.first as Map<String, dynamic>)['latencyMs'], equals(1200));
  });

  test('exportToCsv writes expected header and escapes error content', () async {
    final entry = MetricEntry(
      timestamp: DateTime.parse('2026-04-04T08:00:00Z'),
      latencyMs: 950,
      memoryBeforeBytes: 2048,
      memoryAfterBytes: 4096,
      promptLength: 10,
      responseLength: 30,
      success: false,
      errorMessage: 'Network "timeout", retry\nneeded',
      promptWordCount: 2,
      responseWordCount: 5,
      responseCharsPerSecond: 45.5,
      responseWordsPerSecond: 7.7,
      promptToResponseRatio: 3.0,
    );

    await recorder.recordEntry(entry);
    final csvFile = await recorder.exportToCsv();
    final csv = await csvFile.readAsString();

    expect(await csvFile.exists(), isTrue);
    expect(csv, contains('timestamp,latency_ms,memory_before_bytes,memory_after_bytes'));
    expect(csv, contains('"Network ""timeout"", retry'));
    expect(csv, contains('needed"'));
    expect(csv, contains('false'));
  });
}
