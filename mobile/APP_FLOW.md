# ResQConnect Mobile App Flow

This document outlines the detailed architecture and execution flow of the ResQConnect mobile application, focusing primarily on its core functionality: downloading and running inference on an on-device Large Language Model (LLM) using Google's MediaPipe Tasks API.

## High-Level Overview

The mobile app is built using **Flutter** for the cross-platform UI and utilizes **Platform Channels** to communicate with native Android code. The native Android layer leverages the **Google MediaPipe GenAI Tasks API** to run on-device inference on a Qwen 0.5B Instruct model in the `.task` format. 

The primary workflow consists of:
1. **Initialization & Setup**: The app sets up Method and Event channels.
2. **Model Downloading**: Downloading the `.task` model from the Hugging Face Hub directly to the device storage.
3. **User Interaction**: Receiving user input via the chat interface and handling simple queries with rule-based logic.
4. **On-Device Inference**: Passing complex queries to the native layer, running the MediaPipe LLM engine, and streaming tokens back to the UI.
5. **Metrics Collection**: Tracking latency, token generation speed, and memory usage for analysis.

*(Note: The app also contains a help request submission feature, which is out of scope for this document.)*

---

## Detailed Execution Flow

### 1. Flutter UI Layer (`lib/screens/chat_screen.dart`)

The user interacts with the `ChatScreen`, which acts as the main interface.

* **Rule-Based Pre-check**: When a user submits a prompt, the app first checks against a set of predefined rules (`_getRuleBasedResponse`). If the user sends a simple greeting or asks about the bot's identity (e.g., "Hi", "Who are you?"), the app immediately returns a simulated streaming response without waking up the LLM engine.
* **Model Verification**: If the query is complex, the app queries the native platform via `LlmPlatformChannel.isModelDownloaded()` to ensure the `.task` file is present on the device.
* **Streaming Setup**: Before initiating generation, the UI sets up a listener on an `EventChannel` (`LlmPlatformChannel.responseStream`) to receive partial tokens and update the chat UI progressively, creating a typing effect.
* **Inference Request**: The UI then invokes `LlmPlatformChannel.generateResponse(userText)` to start the actual generation process.

### 2. Flutter Platform Channel Layer (`lib/services/llm_platform_channel.dart`)

This layer acts as the bridge between Dart and Native code using `MethodChannel` (`llm_inference`) and `EventChannel` (`llm_inference_stream`).

* **Streaming and Chunk Cleaning**: The `_initResponseStreamListener` method listens for events from the native EventChannel. As tokens arrive, they are passed through a `_cleanChunk` method. This cleaning process strips out special model tokens (like `<|im_end|>`, `<source>`, etc.) and normalizes whitespace while preserving word boundaries, emitting clean chunks to the UI stream.
* **Generation Invocation & Metrics**: `generateResponse` records the memory state before and after the method call, starts a stopwatch, and invokes the `generateResponse` method on the native channel. Once the full response completes, it calculates vital metrics such as:
  * First Token Latency
  * Total Latency
  * Memory Consumed
  * Words and Characters per Second (Generation Speed)
  These metrics are logged to the `MetricsRecorder`.
* **Final Response Cleaning**: Once generation finishes, a final `_cleanResponse` pass ensures any trailing artifacts or prompt bleed are removed.

### 3. Native Android Layer (`android/app/src/main/kotlin/com/example/resqconnect_edge_app/MainActivity.kt`)

The `MainActivity` receives the platform channel calls and orchestrates the heavy lifting.

* **Model Downloading**:
  * Triggered by the `downloadModel` method call from Flutter.
  * The model URL is predefined in `Model.kt` as a Hugging Face Hub link (`https://huggingface.co/veejask/ResQEdge/resolve/main/qwen.task`).
  * The native code opens an `HttpURLConnection`, streams the file to the app's internal `filesDir`, and periodically reports the download progress (bytes downloaded vs. total) back to Flutter.
  * Once completed, the model's local path is saved in `SharedPreferences` for future sessions.
* **Inference Routing**:
  * Upon receiving the `generateResponse` call, `MainActivity` initializes the `InferenceModel` singleton if it hasn't been instantiated.
  * It records the start time and initiates an asynchronous generation request on the `InferenceModel`.
  * It passes a custom `ProgressListener` to MediaPipe. As MediaPipe generates tokens, this listener captures the arrival time of the *first token* (for latency metrics) and pipes the partial text chunks directly into the `streamSink` (the EventChannel) to update the Flutter UI in real-time.

### 4. MediaPipe Inference Engine (`android/app/src/main/kotlin/com/example/resqconnect_edge_app/InferenceModel.kt`)

This is where the actual LLM execution happens using the `com.google.mediapipe.tasks.genai.llminference` package.

* **Engine Configuration (`createEngine`)**:
  * Initializes the `LlmInference` engine using `LlmInferenceOptions`.
  * Loads the `.task` model file from the path saved during the download phase.
  * Sets the maximum tokens to generate (e.g., 128 tokens) and configures it to use the CPU backend (`PREFERRED_BACKEND_CPU`).
* **Session Management (`createSession`)**:
  * Creates an `LlmInferenceSession` with specific hyperparameter configurations defined in `Model.kt`, such as:
    * **Temperature**: 0.95 (controls randomness/creativity)
    * **TopK**: 40
    * **TopP**: 1.0
* **Execution**:
  * `generateResponseAsync` feeds the user's prompt into the session using `addQueryChunk(prompt)` and starts the generation. MediaPipe handles the internal tokenization, forward pass, and detokenization.
* **Session Reset**:
  * After a response is fully generated, the Flutter app's completion handler triggers `modelInstance?.resetSession()`. This closes the current context window and spins up a fresh session, preventing the context from growing indefinitely and ensuring isolated turn-by-turn responses.
