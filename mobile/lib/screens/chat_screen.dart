import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/llm_platform_channel.dart';
import '../theme/app_theme.dart';
import 'metrics_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<_ChatMessage> _messages = [];
  bool _isThinking = false;
  final ScrollController _scrollController = ScrollController();
  
  // SCRIPTED DEMO DATA
  int _scriptIndex = 0;
  final List<Map<String, String>> _demoScript = [
    {
      "user": "There is a flood warning in my area, what should I do?",
      "bot": "I understand this is stressful. First, are you currently indoors or outdoors? And do you see any rising water near your location?"
    },
    {
      "user": "I am inside, the water is rising on the street but hasn't entered the house yet.",
      "bot": "Okay. Please turn off your main power and gas if you can do so safely. Move essential items and yourself to the highest floor. Do NOT walk through moving water. Do you have an emergency kit ready?"
    },
    {
      "user": "Yes, I have some water and a flashlight.",
      "bot": "That is good. Keep your phone charged and stay tuned to local news. If the water level rises significantly, prepare to move to the roof, but only if necessary. Do not go into the attic unless it has an open window. Stay safe."
    },
    {
      "user": "Thank you, I will stay upstairs.",
      "bot": "You're welcome. Access my 'Help' menu if you need to send an SOS signal or share your location with authorities. Stay alert."
    }
  ];

  @override
  void initState() {
    super.initState();
    // Pre-fill the first question for the demo
    _loadNextScriptStep();
  }

  void _loadNextScriptStep() {
    if (_scriptIndex < _demoScript.length) {
      _controller.text = _demoScript[_scriptIndex]['user']!;
    } else {
      _controller.text = ""; // Script finished
    }
  }

  void _sendMessage() async {
    // For the demo, we ignore what was typed if it doesn't match, 
    // OR we just use the current text if the user edited it.
    // But to ensure the "Hardcoded User Question" requirement is met, 
    // we essentially play the script step regardless of minor edits, 
    // OR we assume the user hits send on the pre-filled text.
    
    final userText = _controller.text.trim();
    if (userText.isEmpty) return;

    _controller.clear();
    setState(() {
      _messages.add(_ChatMessage(userText, true));
      _isThinking = true;
    });

    _scrollToBottom();

    // SCRIPTED RESPONSE LOGIC
    try {
      await Future.delayed(const Duration(seconds: 2));
      
      String responseText;
      if (_scriptIndex < _demoScript.length) {
        responseText = _demoScript[_scriptIndex]['bot']!;
        _scriptIndex++; // Advance to next step
      } else {
        responseText = "Demo conversation complete. Please restart the app to reset the simulation.";
      }

      setState(() {
        _messages.add(_ChatMessage(responseText, false));
      });
      
      // Auto-fill next user question
      _loadNextScriptStep();

    } catch (e) {
      setState(() {
        _messages.add(_ChatMessage('Error: $e', false));
      });
    } finally {
      if (mounted) {
        setState(() {
          _isThinking = false;
        });
        _scrollToBottom();
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0.0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final reversedMessages = _messages.reversed.toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor.withOpacity(0.8),
        flexibleSpace: Container(
           decoration: BoxDecoration(
             gradient: LinearGradient(
               begin: Alignment.topCenter,
               end: Alignment.bottomCenter,
               colors: [
                 theme.scaffoldBackgroundColor,
                 theme.scaffoldBackgroundColor.withOpacity(0.1),
               ],
             ),
           ),
        ),
        title: Text(
          "ResQEdge AI",
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold, 
            fontSize: 20,
            color: theme.colorScheme.onSurface,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.analytics_outlined, color: theme.colorScheme.primary),
            tooltip: 'View metrics',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const MetricsScreen()),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                reverse: true,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100), 
                itemCount: reversedMessages.length + (_isThinking ? 1 : 0),
                itemBuilder: (context, index) {
                  if (_isThinking && index == 0) {
                    return _buildBotBubble(
                      context,
                      child: const _TypingIndicator(),
                    );
                  }

                  final msg = reversedMessages[_isThinking ? index - 1 : index];
                  return msg.isUser
                      ? _buildUserBubble(context, msg)
                      : _buildBotBubble(context, child: Text(msg.text, style: theme.textTheme.bodyLarge));
                },
              ),
            ),
            _buildFloatingInput(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildUserBubble(BuildContext context, _ChatMessage msg) {
    final theme = Theme.of(context);
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [theme.colorScheme.primary, AppTheme.primaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.primary.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(4),
          ),
        ),
        child: Text(
          msg.text,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildBotBubble(BuildContext context, {required Widget child}) {
    final theme = Theme.of(context);
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(4),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 5,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: DefaultTextStyle(
          style: theme.textTheme.bodyLarge!, 
          child: child,
        ),
      ),
    );
  }

  Widget _buildFloatingInput(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      decoration: const BoxDecoration(
        color: Colors.transparent, 
      ),
      child: SafeArea(
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            children: [
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _controller,
                  onSubmitted: (_) => _sendMessage(),
                  style: theme.textTheme.bodyMedium,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.5)),
                    filled: false,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_upward_rounded, color: Colors.white),
                  onPressed: _isThinking ? null : _sendMessage,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isUser;
  _ChatMessage(this.text, this.isUser);
}

class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  _TypingIndicatorState createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 40,
      height: 20,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(3, (index) {
          return FadeTransition(
            opacity: DelayTween(begin: 0.3, end: 1.0, delay: index * 0.2).animate(_controller),
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                shape: BoxShape.circle,
              ),
            ),
          );
        }),
      ),
    );
  }
}

class DelayTween extends Tween<double> {
  final double delay;

  DelayTween({required super.begin, required super.end, required this.delay});

  @override
  double lerp(double t) {
    return super.lerp((t - delay).clamp(0.0, 1.0));
  }
}
