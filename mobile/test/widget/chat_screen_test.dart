import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:resqconnect_edge_app/screens/chat_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const MethodChannel llmChannel = MethodChannel('llm_inference');

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(llmChannel, (MethodCall call) async {
      if (call.method == 'isModelDownloaded') {
        return false;
      }
      if (call.method == 'generateResponse') {
        return 'mocked response';
      }
      return null;
    });
  });

  tearDown(() async {
    await TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(llmChannel, null);
  });

  testWidgets('ChatScreen returns rule-based greeting for "hi"', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: ChatScreen()),
    );

    await tester.enterText(find.byType(TextField), 'hi');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    await tester.pump();

    expect(find.text('hi'), findsOneWidget);

    await tester.pump(const Duration(seconds: 2));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.textContaining('Hello! I\'m ResQEdge AI'), findsOneWidget);
  });

  testWidgets('ChatScreen shows model download warning for unknown prompt', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: ChatScreen()),
    );

    await tester.enterText(find.byType(TextField), 'Give me evacuation steps');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Model not downloaded. Please download the model first.'), findsOneWidget);
  });
}
