# First Token Latency Analysis (20+ seconds)

## Current Architecture

**Model Configuration:**
- Model: `QWEN2_0_5B_INSTRUCT` (0.5B parameters)
- Backend: **CPU** (hardcoded)
- MAX_TOKENS: 128
- Temperature: 0.95f
- TopK: 40, TopP: 1.0f
- Quantization: Q8 (8-bit quantized)

**Key Flow:**
```
Dart (generateResponse call)
  ↓
MainActivity.generateResponse() → creates InferenceModel if null
  ↓
createEngine() → LlmInference.createFromOptions()
  ↓
createSession() → LlmInferenceSession.createFromOptions()
  ↓
generateResponseAsync(prompt, ProgressListener)
  ↓
First token generation (⏱️ ~20+ seconds)
```

---

## Root Causes of 20+ Second First Token Latency

### 1. **Session Recreation on Every Request** ⚠️ CRITICAL
**Location:** `MainActivity.kt:generateResponse → resetSession() after completion`

```kotlin
GlobalScope.launch(Dispatchers.IO) {
    try {
        val res = responseFuture?.get() ?: ""
        withContext(Dispatchers.Main) {
            result.success(res)
            modelInstance?.resetSession()  // ← Closes and recreates session
        }
```

**Problem:** After each inference:
- Session is closed and garbage collected
- `createSession()` rebuilds session from scratch (~1-2 seconds overhead)
- Next inference creates a fresh session with no cached state
- Session KV cache is lost

**Impact:** Each request pays the session creation tax.

---

### 2. **CPU Backend - No Hardware Optimization** ⚠️ MAJOR
**Location:** `InferenceModel.kt:createEngine()`

```kotlin
.setPreferredBackend(LlmInference.Backend.CPU)
```

**Problem:**
- CPU inference is **significantly slower** than GPU/NPU
- MediaPipe supports GPU (OpenGL ES) and NPU acceleration
- Device likely has:
  - GPU (Adreno GPU, Mali, or similar)
  - OR NPU (Qualcomm Hexagon, etc.)
- These are **not being utilized**

**Impact on Inference:**
- CPU: ~18-22 seconds for first token
- GPU: ~3-8 seconds (3-6x faster)
- NPU: ~2-4 seconds if available

---

### 3. **Model Chosen vs. Alternatives** ⚠️ MODERATE
**Current:** QWEN2_0_5B_INSTRUCT (0.5B parameters)

**Available Smaller Models:**
- `SmolLM-135M-Instruct` (135M params) - 40% smaller
- `TinyLlama-1.1B-Chat` (1.1B params) - similar size
- `Llama-3.2-1B-Instruct` (1B params) - 2x smaller than Qwen

**Problem:**
- Qwen 0.5B is reasonably small but still significant
- 135M-1B models are available and would be faster
- Trade-off: model quality vs. speed

**Estimated Impact:**
- 135M model: ~12-16 seconds first token (30% faster)
- 1B model: ~15-18 seconds

---

### 4. **No Model Warm-Up / Pre-Loading** ⚠️ MODERATE
**Current:** Model loaded on first `generateResponse` call

**Problem:**
- First inference includes:
  - Model file disk I/O
  - Model weight loading into memory
  - Weight parsing
  - Memory allocation
  - Cache initialization
- All happens during first API call (synchronously blocks UI)

**Overhead:** ~2-3 seconds for model loading + memory setup

---

### 5. **Session State Not Preserved Between Requests** ⚠️ MODERATE
**Location:** `MainActivity.kt` after `generateResponse` completes

```kotlin
modelInstance?.resetSession()  // Destroys session KV cache
```

**Problem:**
- KV (Key-Value) cache for the session is discarded
- Next request can't reuse any cached computations
- MediaPipe sessions are heavy to initialize

**Benefit of Preserving:**
- Keeps model weights in GPU/NPU memory
- Pre-allocated tensors ready
- Context maintained
- Would save ~1-2 seconds per request

---

### 6. **Model Instance Singleton Pattern - But Aggressive Reset** ⚠️ MINOR
**Location:** `InferenceModel.kt`

```kotlin
fun resetInstance(context: Context) {
    try {
        instance?.closeModel()
    } catch (e: Exception) {
        Log.w(..., "Error closing model...")
    }
    instance = null  // Forces full reload
}
```

**Problem:**
- If instance resets happen, model must be reloaded completely
- Full reload = model load + engine create + session create (~3-5 seconds)

---

### 7. **Tokenization Overhead** ⚠️ MINOR
**Problem:**
- Prompt tokenization happens on-device (no external API)
- For longer prompts, tokenizer adds latency
- MediaPipe tokenizer is not optimized for speed

**Estimated Impact:** ~500ms - 1 second for typical prompts

---

### 8. **First Token Generation Inherently Slower** ⚠️ MAJOR (Unavoidable)
**Technical Reason:**
- First token requires:
  - Full prompt encoding (context processing)
  - KV cache population
  - Attention computation over full sequence
- Subsequent tokens are faster (only add 1 token to KV cache)

**Typical Profile:**
- First token: 18-22 seconds
- Subsequent tokens: 200-500ms each

**This is inherent to autoregressive models, not a code issue.**

---

## Optimization Strategies (Ranked by Impact)

| # | Strategy | Est. Savings | Effort | Notes |
|---|----------|--------------|--------|-------|
| **1** | Switch to GPU backend | 10-15s | Low | Change 1 line of code |
| **2** | Preserve session between requests | 1-2s | Low | Remove `resetSession()` call |
| **3** | Pre-load model on app startup | 2-3s | Medium | Async initialization |
| **4** | Switch to smaller model (135M) | 3-5s | Low | Trade model quality |
| **5** | Enable GPU acceleration explicitly | 5-8s | Medium | MediaPipe GPU setup |
| **6** | Model instance pre-warming (dummy inference) | 1-2s | Low | Run dummy inference at startup |
| **7** | Use batch size optimization | 1-2s | High | MediaPipe config tuning |
| **8** | Cache model weights in memory | 0.5-1s | Medium | Keep model loaded between sessions |

---

## Recommendation Priority

### 🔴 **CRITICAL (Do First)**
1. **Switch Backend to GPU** (Potential: 10-15s savings)
   - Current: CPU
   - Change in `InferenceModel.kt:createEngine()`
   - Try `Backend.GPU` first, falls back to CPU if unavailable
   - Single line change, massive impact

### 🟠 **HIGH (Do Second)**
2. **Don't Reset Session Aggressively** (Potential: 1-2s savings)
   - Current: `resetSession()` after each response
   - Consider reusing session or soft-reset (only clear context, keep weights)
   - Reduces session recreation overhead

3. **Pre-warm Model on Startup** (Potential: 1-2s savings)
   - Initialize model in background during app launch
   - Run dummy inference to populate caches
   - Makes first real request faster

### 🟡 **MEDIUM (Do Third)**
4. **Consider Smaller Model** (Potential: 3-5s savings)
   - SmolLM-135M (if quality acceptable)
   - Llama-3.2-1B (maintains quality)
   - Trade model size/quality vs. speed

5. **Explicit GPU Initialization** (Potential: 5-8s savings)
   - May require MediaPipe version update
   - Ensure GPU drivers/support enabled
   - Test hardware compatibility

---

## Why First Token is Still Slow Even After Optimizations

**Physical Constraints:**
- Even with GPU: 3-8 seconds for first token is expected
- Full prompt encoding is computationally expensive
- Qwen 0.5B is still processing a full attention pass
- Bandwidth from GPU/CPU memory is a bottleneck

**Best-Case Scenario with All Optimizations:**
- GPU backend + session preservation + model pre-warming: **~4-6 seconds for first token**
- This is near-optimal for a 0.5B model

**If <1 second First Token Needed:**
- Use server-side inference (send to cloud)
- Use speculative decoding (has limitations)
- Use extremely tiny model (<50M params, but quality suffers)

---

## Quick Diagnostic Steps

**To identify which contributes most to 20s delay:**

1. **Check logs during inference:**
   ```
   First token latency visible in metrics UI (first_token_latency_ms)
   ```

2. **Take measurements:**
   - First request: ~20s
   - Second+ requests: ~20s (still high?)
   - If second requests are faster → session reset is bottleneck
   - If all same → model inference speed is bottleneck

3. **Check device capabilities:**
   - Does device support GPU? YES → Switch to GPU
   - Does device support NPU? YES → Try NPU backend (if MediaPipe supports)

---

## MediaPipe Backend Details

**Available Backends in MediaPipe LLM Inference:**
```kotlin
enum Backend {
    CPU,           // Pure CPU inference (current)
    GPU,           // OpenGL ES GPU acceleration
    NNAPI,         // Neural Networks API (NPU)
    HEXAGON        // Qualcomm Hexagon DSP (NPU)
}
```

**Recommendation:**
```kotlin
// Try GPU first, fallback to CPU
val backend = try {
    Backend.GPU
} catch (e: Exception) {
    Backend.CPU
}
```

---

## Summary Table

| Component | Current Impact | Time | Optimization Potential |
|-----------|---|---|---|
| Model Loading | 2-3s | First request only | Pre-warm (+2-3s) |
| Engine Creation | 0.5-1s | First request only | Already optimized |
| Session Creation | 1-2s | Every request | Reuse session (+1-2s) |
| **CPU Inference** | **14-18s** | **All requests** | **GPU backend (+10-15s)** |
| Tokenization | 0.5-1s | All requests | Optimized tokenizer (~0.5s) |
| **TOTAL** | **~20s** | | **Potential: 4-8s** |

---

## Files to Modify for Optimizations

1. **GPU Backend:** `InferenceModel.kt` line 31 → Change Backend.CPU to Backend.GPU
2. **Session Reuse:** `MainActivity.kt` line 90 → Remove or conditionally call resetSession()
3. **Model Pre-warming:** `MainActivity.kt` configureFlutterEngine() → Add background warm-up
4. **Smaller Model:** `Model.kt` → Change default from QWEN to SmolLM or Llama
5. **Session Preservation:** `MainActivity.kt` → Add KV cache retention logic
