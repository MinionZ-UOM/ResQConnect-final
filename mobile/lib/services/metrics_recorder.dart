import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

class MetricEntry {
  MetricEntry({
    required this.timestamp,
    required this.latencyMs,
    required this.memoryBeforeBytes,
    required this.memoryAfterBytes,
    required this.promptLength,
    required this.responseLength,
    required this.success,
    this.errorMessage,
    int? promptWordCount,
    int? responseWordCount,
    double? responseCharsPerSecond,
    double? responseWordsPerSecond,
    double? promptToResponseRatio,
  })  : memoryDeltaBytes = memoryAfterBytes - memoryBeforeBytes,
        promptWordCount = promptWordCount ?? 0,
        responseWordCount = responseWordCount ?? 0,
        responseCharsPerSecond = responseCharsPerSecond ?? 0,
        responseWordsPerSecond = responseWordsPerSecond ?? 0,
        promptToResponseRatio = promptToResponseRatio ?? 0;

  factory MetricEntry.fromJson(Map<String, dynamic> json) {
    return MetricEntry(
      timestamp: DateTime.parse(json['timestamp'] as String),
      latencyMs: json['latencyMs'] as int,
      memoryBeforeBytes: json['memoryBeforeBytes'] as int,
      memoryAfterBytes: json['memoryAfterBytes'] as int,
      promptLength: json['promptLength'] as int,
      responseLength: json['responseLength'] as int,
      success: json['success'] as bool,
      errorMessage: json['errorMessage'] as String?,
      promptWordCount: json['promptWordCount'] as int?,
      responseWordCount: json['responseWordCount'] as int?,
      responseCharsPerSecond: (json['responseCharsPerSecond'] as num?)?.toDouble(),
      responseWordsPerSecond: (json['responseWordsPerSecond'] as num?)?.toDouble(),
      promptToResponseRatio: (json['promptToResponseRatio'] as num?)?.toDouble(),
    );
  }

  final DateTime timestamp;
  final int latencyMs;
  final int memoryBeforeBytes;
  final int memoryAfterBytes;
  final int memoryDeltaBytes;
  final int promptLength;
  final int responseLength;
  final bool success;
  final String? errorMessage;
  final int promptWordCount;
  final int responseWordCount;
  final double responseCharsPerSecond;
  final double responseWordsPerSecond;
  final double promptToResponseRatio;

  Map<String, dynamic> toJson() {
    return {
      'timestamp': timestamp.toIso8601String(),
      'latencyMs': latencyMs,
      'memoryBeforeBytes': memoryBeforeBytes,
      'memoryAfterBytes': memoryAfterBytes,
      'memoryDeltaBytes': memoryDeltaBytes,
      'promptLength': promptLength,
      'responseLength': responseLength,
      'success': success,
      'errorMessage': errorMessage,
      'promptWordCount': promptWordCount,
      'responseWordCount': responseWordCount,
      'responseCharsPerSecond': responseCharsPerSecond,
      'responseWordsPerSecond': responseWordsPerSecond,
      'promptToResponseRatio': promptToResponseRatio,
    };
  }
}

class MetricsRecorder extends ChangeNotifier {
  MetricsRecorder._();

  static final MetricsRecorder instance = MetricsRecorder._();
  static const MethodChannel _platformChannel = MethodChannel('llm_inference');

  final List<MetricEntry> _entries = [];
  bool _initialized = false;
  File? _storageFile;

  List<MetricEntry> get entries => List.unmodifiable(_entries);

  bool get isInitialized => _initialized;

  Future<void> ensureInitialized() async {
    if (_initialized) {
      return;
    }

    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/llm_metrics.json');
    _storageFile = file;

    if (await file.exists()) {
      final contents = await file.readAsString();
      if (contents.isNotEmpty) {
        final List<dynamic> decoded = jsonDecode(contents) as List<dynamic>;
        _entries
          ..clear()
          ..addAll(
            decoded
                .whereType<Map<String, dynamic>>()
                .map(MetricEntry.fromJson),
          );
      }
    }

    _initialized = true;
    notifyListeners();
  }

  Future<void> recordEntry(MetricEntry entry) async {
    await ensureInitialized();
    _entries.add(entry);
    await _persist();
    notifyListeners();
  }

  Future<File> exportToCsv() async {
    await ensureInitialized();
    final buffer = StringBuffer()
      ..writeln(
        'timestamp,latency_ms,memory_before_bytes,memory_after_bytes,memory_delta_bytes,prompt_length,response_length,prompt_word_count,response_word_count,response_chars_per_second,response_words_per_second,prompt_to_response_ratio,success,error_message',
      );

    for (final entry in _entries) {
      final row = [
        entry.timestamp.toIso8601String(),
        entry.latencyMs.toString(),
        entry.memoryBeforeBytes.toString(),
        entry.memoryAfterBytes.toString(),
        entry.memoryDeltaBytes.toString(),
        entry.promptLength.toString(),
        entry.responseLength.toString(),
        entry.promptWordCount.toString(),
        entry.responseWordCount.toString(),
        entry.responseCharsPerSecond.toStringAsFixed(2),
        entry.responseWordsPerSecond.toStringAsFixed(2),
        entry.promptToResponseRatio.toStringAsFixed(2),
        entry.success.toString(),
        _escapeCsv(entry.errorMessage ?? ''),
      ];

      buffer.writeln(row.join(','));
    }

    final csvContents = buffer.toString();
    File? exportedFile;

    if (!kIsWeb && Platform.isAndroid) {
      final downloadsDirectory = await _resolveAndroidDownloadsDirectory();
      if (downloadsDirectory != null) {
        final candidate = File('${downloadsDirectory.path}/llm_metrics.csv');
        try {
          await candidate.writeAsString(csvContents);
          exportedFile = candidate;
        } catch (_) {
          exportedFile = null;
        }
      }
    }

    if (exportedFile == null) {
      Directory? directory;
      if (!kIsWeb) {
        directory = await getDownloadsDirectory();
      }

      directory ??= await getApplicationDocumentsDirectory();
      final fallbackFile = File('${directory.path}/llm_metrics.csv');
      await fallbackFile.writeAsString(csvContents);
      exportedFile = fallbackFile;
    }

    return exportedFile;
  }

  Future<void> clear() async {
    await ensureInitialized();
    _entries.clear();
    await _persist();
    notifyListeners();
  }

  Future<void> _persist() async {
    final file = _storageFile;
    if (file == null) {
      return;
    }

    final encoded = jsonEncode(_entries.map((e) => e.toJson()).toList());
    await file.writeAsString(encoded);
  }

  String _escapeCsv(String value) {
    if (value.contains(',') || value.contains('\n') || value.contains('"')) {
      final escaped = value.replaceAll('"', '""');
      return '"$escaped"';
    }
    return value;
  }

  Future<Directory?> _resolveAndroidDownloadsDirectory() async {
    try {
      final path = await _platformChannel.invokeMethod<String>('getPublicDownloadsDirectory');
      if (path != null && path.isNotEmpty) {
        final directory = Directory(path);
        if (await directory.exists()) {
          return directory;
        }
        try {
          return await directory.create(recursive: true);
        } catch (_) {
          // Fall through to fallback locations below.
        }
      }
    } catch (_) {
      // Ignore failures from the platform channel and try fallbacks below.
    }

    const fallbackPaths = [
      '/storage/emulated/0/Download',
      '/sdcard/Download',
    ];

    for (final path in fallbackPaths) {
      final directory = Directory(path);
      try {
        if (await directory.exists()) {
          return directory;
        }
        return await directory.create(recursive: true);
      } catch (_) {
        // Try the next fallback path.
      }
    }

    return null;
  }
}
