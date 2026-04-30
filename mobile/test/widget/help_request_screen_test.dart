import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:resqconnect_edge_app/screens/help_request_screen.dart';

void main() {
  testWidgets('HelpRequestScreen shows validation errors for empty form', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: HelpRequestScreen()),
    );

    await tester.tap(find.text('Send Request'));
    await tester.pump();

    expect(find.text('Please select a disaster type'), findsOneWidget);
    expect(find.text('Please provide some details'), findsOneWidget);
  });

  testWidgets('HelpRequestScreen requires location before submit', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: HelpRequestScreen()),
    );

    await tester.tap(find.text('Type of Disaster'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Flood').last);
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byType(TextFormField).last,
      'Family trapped and immediate support required.',
    );

    await tester.tap(find.text('Send Request'));
    await tester.pump();

    expect(find.text('Please add your location.'), findsOneWidget);
  });
}
