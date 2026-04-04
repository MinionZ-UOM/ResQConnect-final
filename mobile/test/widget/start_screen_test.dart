import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:resqconnect_edge_app/screens/start_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const MethodChannel llmChannel = MethodChannel('llm_inference');

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(llmChannel, (MethodCall call) async {
      if (call.method == 'isModelDownloaded') {
        return true;
      }
      if (call.method == 'downloadModel') {
        return true;
      }
      return null;
    });
  });

  tearDown(() async {
    await TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(llmChannel, null);
  });

  testWidgets('StartScreen shows Enter Chat button when model is downloaded', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: StartScreen()),
    );

    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Enter Chat'), findsOneWidget);
    expect(find.text('Download Offline Model'), findsNothing);
  });
}
