import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

// Add 'with SingleTickerProviderStateMixin' for animation controller
class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();

    // --- Animation Setup ---
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    );
    _controller.forward(); // Start the animation

    // --- Navigation Logic (Unchanged) ---
    Future.delayed(const Duration(seconds: 3), () {
      // Use pushReplacementNamed to prevent user from going back to the splash screen
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose(); // Dispose the controller to free up resources
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      // Use the theme's primary color for a consistent look
      backgroundColor: colorScheme.primary,
      body: Center(
        // Use FadeTransition to apply the fade-in effect
        child: FadeTransition(
          opacity: _animation,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // --- App Logo/Icon ---
              Icon(
                Icons.shield_outlined,
                size: 80,
                color: colorScheme.onPrimary,
              ),
              const SizedBox(height: 24),

              // --- App Name ---
              Text(
                'ResQEdge',
                style: theme.textTheme.headlineLarge?.copyWith(
                  color: colorScheme.onPrimary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 48),

              // --- Loading Indicator ---
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(colorScheme.onPrimary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}