import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/home_page.dart';
import 'screens/help_request_screen.dart';
import 'screens/start_screen.dart';
import 'services/metrics_recorder.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await MetricsRecorder.instance.ensureInitialized();
  runApp(const ResQEdgeApp());
}

class ResQEdgeApp extends StatelessWidget {
  const ResQEdgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ResQEdge',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/home': (context) => const HomePage(),
        '/help': (context) => const HelpRequestScreen(),
        '/resqbot': (context) => const StartScreen(),
      },
    );
  }
}
