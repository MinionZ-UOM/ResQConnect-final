import 'package:flutter/material.dart';

import '../services/metrics_recorder.dart';

class MetricsScreen extends StatefulWidget {
  const MetricsScreen({super.key});

  @override
  State<MetricsScreen> createState() => _MetricsScreenState();
}

class _MetricsScreenState extends State<MetricsScreen> {
  final MetricsRecorder _recorder = MetricsRecorder.instance;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _recorder.addListener(_handleUpdate);
    _initialise();
  }

  @override
  void dispose() {
    _recorder.removeListener(_handleUpdate);
    super.dispose();
  }

  Future<void> _initialise() async {
    await _recorder.ensureInitialized();
    if (mounted) {
      setState(() {
        _loading = false;
      });
    }
  }

  void _handleUpdate() {
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  Future<void> _exportMetrics() async {
    final file = await _recorder.exportToCsv();
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Metrics exported to ${file.path}')),
    );
  }

  Future<void> _deleteAllMetrics() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete All Metrics'),
        content: const Text('Are you sure you want to delete all recorded metrics? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _recorder.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All metrics deleted')),
        );
      }
    }
  }

  Future<void> _deleteMetric(MetricEntry entry) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Metric'),
        content: const Text('Are you sure you want to delete this metric entry?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _recorder.removeEntry(entry);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Metric deleted')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final entries = _recorder.entries.reversed.toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('LLM Metrics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            tooltip: 'Delete All Metrics',
            onPressed: entries.isEmpty ? null : _deleteAllMetrics,
          ),
          IconButton(
            icon: const Icon(Icons.download_outlined),
            tooltip: 'Export as CSV',
            onPressed: entries.isEmpty ? null : _exportMetrics,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : entries.isEmpty
              ? const _EmptyState()
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final entry = entries[index];
                    return _MetricTile(
                      entry: entry,
                      onDelete: () => _deleteMetric(entry),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemCount: entries.length,
                ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.entry, required this.onDelete});

  final MetricEntry entry;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final latency = '${entry.latencyMs} ms';
    final memoryDeltaMb = (entry.memoryDeltaBytes / (1024 * 1024)).toStringAsFixed(2);
    final memoryAfterMb = (entry.memoryAfterBytes / (1024 * 1024)).toStringAsFixed(2);

    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _formatTimestamp(entry.timestamp),
                  style: theme.textTheme.titleMedium,
                ),
                Row(
                  children: [
                    Icon(
                      entry.success ? Icons.check_circle_outline : Icons.error_outline,
                      color: entry.success
                          ? theme.colorScheme.primary
                          : theme.colorScheme.error,
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      onPressed: onDelete,
                      tooltip: 'Delete this metric',
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _MetricChip(label: 'Latency', value: latency),
                _MetricChip(label: 'Memory Δ', value: '$memoryDeltaMb MB'),
                _MetricChip(label: 'Memory (after)', value: '$memoryAfterMb MB'),
                _MetricChip(label: 'Prompt chars', value: '${entry.promptLength}'),
                _MetricChip(label: 'Response chars', value: '${entry.responseLength}'),
                _MetricChip(label: 'Prompt words', value: '${entry.promptWordCount}'),
                _MetricChip(label: 'Response words', value: '${entry.responseWordCount}'),
                _MetricChip(
                  label: 'Chars/sec',
                  value: entry.responseCharsPerSecond.toStringAsFixed(2),
                ),
                _MetricChip(
                  label: 'Words/sec',
                  value: entry.responseWordsPerSecond.toStringAsFixed(2),
                ),
                _MetricChip(
                  label: 'Resp/Prompt ratio',
                  value: entry.promptToResponseRatio.toStringAsFixed(2),
                ),
              ],
            ),
            if (!entry.success && entry.errorMessage != null && entry.errorMessage!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  entry.errorMessage!,
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    return '${timestamp.year.toString().padLeft(4, '0')}-'
        '${timestamp.month.toString().padLeft(2, '0')}-'
        '${timestamp.day.toString().padLeft(2, '0')} '
        '${timestamp.hour.toString().padLeft(2, '0')}:'
        '${timestamp.minute.toString().padLeft(2, '0')}:'
        '${timestamp.second.toString().padLeft(2, '0')}';
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: RichText(
        text: TextSpan(
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.primary),
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            TextSpan(text: value),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.analytics_outlined, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'No metrics recorded yet',
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Interact with the local model to start collecting latency and memory statistics.',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
