import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // Using the theme for consistent styling
    final ThemeData theme = Theme.of(context);
    final ColorScheme colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('ResQEdge'),
        centerTitle: true,
      ),
      // Use the theme's background color
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // --- Header Section ---
                Text(
                  'How can we help you?',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Select an option below to proceed.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 32),

                // --- Help Request Card ---
                _buildActionCard(
                  context: context,
                  title: 'Help Request',
                  subtitle: 'Request immediate assistance for a disaster.',
                  icon: Icons.report_problem_outlined,
                  // Using semantic colors from the theme
                  startColor: theme.colorScheme.errorContainer.withOpacity(0.8),
                  endColor: theme.colorScheme.errorContainer,
                  iconAndTextColor: theme.colorScheme.onErrorContainer,
                  onTap: () => Navigator.pushNamed(context, '/help'),
                ),
                const SizedBox(height: 20),

                // --- ResQBot Card ---
                _buildActionCard(
                  context: context,
                  title: 'ResQBot',
                  subtitle: 'Chat with our AI for guidance and support.',
                  icon: Icons.smart_toy_outlined,
                  // Using semantic colors from the theme
                  startColor: theme.colorScheme.primaryContainer.withOpacity(0.8),
                  endColor: theme.colorScheme.primaryContainer,
                  iconAndTextColor: theme.colorScheme.onPrimaryContainer,
                  onTap: () => Navigator.pushNamed(context, '/resqbot'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// A reusable helper method to build the action cards.
  Widget _buildActionCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color startColor,
    required Color endColor,
    required Color iconAndTextColor,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 4,
      shadowColor: startColor.withOpacity(0.4),
      clipBehavior: Clip.antiAlias, // Ensures the InkWell ripple stays inside the rounded corners
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: InkWell(
        onTap: onTap,
        splashColor: endColor.withOpacity(0.5),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [startColor, endColor],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 64, color: iconAndTextColor),
              const SizedBox(height: 24),
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: iconAndTextColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: iconAndTextColor.withOpacity(0.8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}