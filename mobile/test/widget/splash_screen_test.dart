import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:resqconnect_edge_app/screens/splash_screen.dart';

void main() {
  testWidgets('SplashScreen routes to /home after 3 seconds', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        initialRoute: '/',
        routes: {
          '/': (_) => const SplashScreen(),
          '/home': (_) => const Scaffold(body: Center(child: Text('Home Loaded'))),
        },
      ),
    );

    expect(find.text('ResQEdge'), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Home Loaded'), findsOneWidget);
  });
}
