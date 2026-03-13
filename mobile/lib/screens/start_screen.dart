import 'package:flutter/material.dart';
import 'dart:async';
import 'package:google_fonts/google_fonts.dart';
import '../services/llm_platform_channel.dart';
import 'chat_screen.dart';

class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  // --- CORE LOGIC (UNCHANGED) ---
  bool _isLoading = false;
  bool _modelDownloaded = false;
  int _downloaded = 0;
  int _total = 0;
  Stream<Map<String, dynamic>>? _progressStream;
  StreamSubscription? _progressSub;

  @override
  void initState() {
    super.initState();
    _checkModelDownloaded();
  }

  @override
  void dispose() {
    _progressSub?.cancel();
    super.dispose();
  }

  Future<void> _checkModelDownloaded() async {
    final downloaded = await LlmPlatformChannel.isModelDownloaded();
    if (mounted) setState(() => _modelDownloaded = downloaded);
  }

  Future<void> _downloadModel(BuildContext context) async {
    setState(() {
      _isLoading = true;
      _downloaded = 0;
      _total = 0;
    });
    _progressStream = LlmPlatformChannel.downloadProgress;
    _progressSub = _progressStream!.listen((event) {
      setState(() {
        _downloaded = event['downloaded'] ?? 0;
        _total = event['total'] ?? 0;
      });
    });
    final success = await LlmPlatformChannel.downloadModel();
    await _progressSub?.cancel();
    setState(() {
      _isLoading = false;
      if (success) _modelDownloaded = true;
      _downloaded = 0;
      _total = 0;
    });
    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const ChatScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Model download failed')),
      );
    }
  }
  // --- END OF CORE LOGIC ---

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              // Icon with glow effect
              Center(
                child: Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.smart_toy_rounded,
                    size: 80,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 48),
              Text(
                'Welcome to\nResQEdge',
                style: GoogleFonts.outfit(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  height: 1.1,
                  color: theme.colorScheme.onBackground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                _modelDownloaded
                    ? 'Model downloaded! Ready to chat with ResQEdge AI.'
                    : 'Your AI-powered assistant for emergency response. Download the offline model to get started.',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onBackground.withOpacity(0.7),
                ),
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              
              // Action Area
              _buildActionArea(theme),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionArea(ThemeData theme) {
    if (_isLoading) {
      return _buildProgressIndicator(theme);
    }

    if (_modelDownloaded) {
      return _buildStyledButton(
        context,
        text: 'Enter Chat',
        icon: Icons.chat_bubble_rounded,
        onPressed: () {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const ChatScreen()),
          );
        },
      );
    }

    return _buildStyledButton(
      context,
      text: 'Download Offline Model',
      icon: Icons.download_rounded,
      onPressed: () => _downloadModel(context),
    );
  }

  Widget _buildStyledButton(BuildContext context, {
    required String text,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        shadowColor: Theme.of(context).colorScheme.primary.withOpacity(0.4),
        elevation: 8,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon),
          const SizedBox(width: 12),
          Text(text),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator(ThemeData theme) {
    double percent = _total > 0 ? _downloaded / _total : 0;
    double mbDownloaded = _downloaded / (1024 * 1024);
    double mbTotal = _total / (1024 * 1024);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Downloading...', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
            Text('${(percent * 100).toStringAsFixed(0)}%', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: _total > 0 ? percent : null,
            minHeight: 16,
            backgroundColor: theme.colorScheme.surfaceVariant,
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${mbDownloaded.toStringAsFixed(1)} MB / ${mbTotal.toStringAsFixed(1)} MB',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onBackground.withOpacity(0.5)),
        ),
      ],
    );
  }
}