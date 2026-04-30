import 'package:flutter_test/flutter_test.dart';
import 'package:resqconnect_edge_app/services/metrics_recorder.dart';

void main() {
  test('MetricEntry serializes and deserializes consistently', () {
    final entry = MetricEntry(
      timestamp: DateTime.parse('2026-04-04T10:00:00Z'),
      latencyMs: 850,
      memoryBeforeBytes: 2 * 1024 * 1024,
      memoryAfterBytes: 3 * 1024 * 1024,
      promptLength: 42,
      responseLength: 84,
      success: true,
      promptWordCount: 7,
      responseWordCount: 15,
      responseCharsPerSecond: 98.45,
      responseWordsPerSecond: 17.65,
      promptToResponseRatio: 2.0,
    );

    final json = entry.toJson();
    final restored = MetricEntry.fromJson(json);

    expect(json['memoryDeltaBytes'], equals(1024 * 1024));
    expect(restored.timestamp.toUtc().toIso8601String(), equals('2026-04-04T10:00:00.000Z'));
    expect(restored.latencyMs, equals(850));
    expect(restored.memoryDeltaBytes, equals(1024 * 1024));
    expect(restored.promptLength, equals(42));
    expect(restored.responseLength, equals(84));
    expect(restored.success, isTrue);
    expect(restored.promptWordCount, equals(7));
    expect(restored.responseWordCount, equals(15));
    expect(restored.responseCharsPerSecond, closeTo(98.45, 0.0001));
    expect(restored.responseWordsPerSecond, closeTo(17.65, 0.0001));
    expect(restored.promptToResponseRatio, closeTo(2.0, 0.0001));
  });
}
