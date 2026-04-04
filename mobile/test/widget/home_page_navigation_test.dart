import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:resqconnect_edge_app/screens/home_page.dart';

void main() {
  testWidgets('HomePage navigates to Help Request screen', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        initialRoute: '/',
        routes: {
          '/': (_) => const HomePage(),
          '/help': (_) => const Scaffold(body: Center(child: Text('Help Page'))),
          '/resqbot': (_) => const Scaffold(body: Center(child: Text('Bot Page'))),
        },
      ),
    );

    await tester.tap(find.text('Help Request'));
    await tester.pumpAndSettle();

    expect(find.text('Help Page'), findsOneWidget);
  });

  testWidgets('HomePage navigates to ResQBot screen', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        initialRoute: '/',
        routes: {
          '/': (_) => const HomePage(),
          '/help': (_) => const Scaffold(body: Center(child: Text('Help Page'))),
          '/resqbot': (_) => const Scaffold(body: Center(child: Text('Bot Page'))),
        },
      ),
    );

    await tester.tap(find.text('ResQBot'));
    await tester.pumpAndSettle();

    expect(find.text('Bot Page'), findsOneWidget);
  });
}
