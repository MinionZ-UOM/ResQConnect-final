package com.example.resqconnect_edge_app

import android.content.Context
import android.util.Log
import com.google.common.util.concurrent.FutureCallback
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors
import com.google.common.util.concurrent.SettableFuture
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession.LlmInferenceSessionOptions
import com.google.mediapipe.tasks.genai.llminference.ProgressListener
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

var MAX_TOKENS = 2048
var DECODE_TOKEN_OFFSET = 256

class ModelLoadFailException : Exception("Failed to load model, please try again")
class ModelSessionCreateFailException : Exception("Failed to create model session, please try again")

private data class ConversationTurn(
    val role: String,
    val content: String
)

class InferenceModel private constructor(context: Context) {
    private lateinit var llmInference: LlmInference
    private lateinit var llmInferenceSession: LlmInferenceSession
    private val TAG = InferenceModel::class.qualifiedName
    private val appContext = context.applicationContext
    private val conversationTurns = mutableListOf<ConversationTurn>()
    private val maxHistoryTurns = 20
    @Volatile
    private var sessionRefreshRequired = false

    init {
        if (!modelExists(context)) throw IllegalArgumentException("Model not found at path: ${Model.QWEN2_0_5B_INSTRUCT.path}")
        createEngine(context)
        createSession()
    }

    private fun createEngine(context: Context) {
        val preferredBackend = resolvePreferredBackend(context)
        var options = LlmInference.LlmInferenceOptions.builder()
            .setModelPath(Model.QWEN2_0_5B_INSTRUCT.path)
            .setMaxTokens(MAX_TOKENS)
            .setPreferredBackend(preferredBackend)
            .build()
        try {
            llmInference = LlmInference.createFromOptions(context, options)
            persistBackend(preferredBackend)
        } catch (e: Exception) {
            if (preferredBackend != LlmInference.Backend.CPU) {
                Log.w(TAG, "Preferred backend $preferredBackend failed, falling back to CPU: ${e.message}")
                options = LlmInference.LlmInferenceOptions.builder()
                    .setModelPath(Model.QWEN2_0_5B_INSTRUCT.path)
                    .setMaxTokens(MAX_TOKENS)
                    .setPreferredBackend(LlmInference.Backend.CPU)
                    .build()
                try {
                    llmInference = LlmInference.createFromOptions(context, options)
                    persistBackend(LlmInference.Backend.CPU)
                    return
                } catch (cpuEx: Exception) {
                    Log.e(TAG, "Load model error after CPU fallback: ${cpuEx.message}", cpuEx)
                    throw ModelLoadFailException()
                }
            }
            Log.e(TAG, "Load model error: ${e.message}", e)
            throw ModelLoadFailException()
        }
    }

    private fun buildSessionOptions(): LlmInferenceSessionOptions {
        return LlmInferenceSessionOptions.builder()
            .setTemperature(Model.QWEN2_0_5B_INSTRUCT.temperature)
            .setTopK(Model.QWEN2_0_5B_INSTRUCT.topK)
            .setTopP(Model.QWEN2_0_5B_INSTRUCT.topP)
            .build()
    }

    private fun createSession() {
        val sessionOptions = buildSessionOptions()
        try {
            llmInferenceSession = LlmInferenceSession.createFromOptions(llmInference, sessionOptions)
        } catch (e: Exception) {
            Log.e(TAG, "Session create error: ${e.message}", e)
            throw ModelSessionCreateFailException()
        }
    }

    private fun backendFromName(name: String?): LlmInference.Backend? {
        if (name.isNullOrBlank()) return null
        return LlmInference.Backend.values().firstOrNull { it.name.equals(name, ignoreCase = true) }
    }

    private fun persistBackend(backend: LlmInference.Backend) {
        appContext.getSharedPreferences("llm_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("inference_backend", backend.name)
            .apply()
    }

    private fun canCreateEngineWithBackend(context: Context, backend: LlmInference.Backend): Boolean {
        return try {
            val probeOptions = LlmInference.LlmInferenceOptions.builder()
                .setModelPath(Model.QWEN2_0_5B_INSTRUCT.path)
                .setMaxTokens(MAX_TOKENS)
                .setPreferredBackend(backend)
                .build()
            val probeEngine = LlmInference.createFromOptions(context, probeOptions)
            probeEngine.close()
            true
        } catch (e: Exception) {
            Log.w(TAG, "Backend probe failed for $backend: ${e.message}")
            false
        }
    }

    private fun resolvePreferredBackend(context: Context): LlmInference.Backend {
        val prefs = appContext.getSharedPreferences("llm_prefs", Context.MODE_PRIVATE)
        val savedBackend = backendFromName(prefs.getString("inference_backend", null))

        // Safety-first: avoid probing arbitrary accelerated backends on startup.
        // Some devices can abort natively instead of throwing recoverable exceptions.
        return when {
            savedBackend == LlmInference.Backend.CPU -> LlmInference.Backend.CPU
            else -> LlmInference.Backend.CPU
        }
    }

    @Synchronized
    private fun addTurn(role: String, content: String): Boolean {
        val normalized = content.trim()
        if (normalized.isEmpty()) return false
        conversationTurns.add(ConversationTurn(role = role, content = normalized))
        // Bound in-memory conversation state to protect app-side prompt management.
        var trimmed = false
        if (conversationTurns.size > maxHistoryTurns) {
            val toDrop = conversationTurns.size - maxHistoryTurns
            repeat(toDrop) { conversationTurns.removeAt(0) }
            trimmed = true
            sessionRefreshRequired = true
        }
        return trimmed
    }

    private fun formatTurnForReplay(turn: ConversationTurn): String {
        return when (turn.role) {
            "assistant" -> "Assistant: ${turn.content}"
            "system" -> "System: ${turn.content}"
            else -> "User: ${turn.content}"
        }
    }

    @Synchronized
    private fun resetSessionInternal(rehydrateFromHistory: Boolean) {
        try {
            llmInferenceSession.close()
        } catch (e: Exception) {
            Log.w(TAG, "Error closing session: ${e.message}")
        }
        createSession()
        if (rehydrateFromHistory) {
            conversationTurns.forEach { turn ->
                llmInferenceSession.addQueryChunk(formatTurnForReplay(turn))
            }
        }
        sessionRefreshRequired = false
    }

    fun generateResponseAsync(prompt: String, progressListener: ProgressListener<String>): ListenableFuture<String> {
        val wasTrimmed = addTurn("user", prompt)
        val needsRefreshNow = sessionRefreshRequired || wasTrimmed
        if (needsRefreshNow) {
            // Refresh only when context budget maintenance requires it, then replay retained history.
            resetSessionInternal(rehydrateFromHistory = true)
        } else {
            llmInferenceSession.addQueryChunk(prompt)
        }
        val responseFuture = llmInferenceSession.generateResponseAsync(progressListener)
        val wrappedFuture = SettableFuture.create<String>()

        Futures.addCallback(
            responseFuture,
            object : FutureCallback<String> {
                override fun onSuccess(responseText: String?) {
                    val finalResponse = responseText ?: ""
                    addTurn("assistant", finalResponse)
                    wrappedFuture.set(finalResponse)
                }

                override fun onFailure(t: Throwable) {
                    wrappedFuture.setException(t)
                }
            },
            MoreExecutors.directExecutor()
        )

        return wrappedFuture
    }

    fun resetSession() {
        resetSessionInternal(rehydrateFromHistory = true)
        Log.d(TAG, "Session reset successfully with conversation rehydration")
    }

    fun warmup(timeoutMs: Long = 2500L) {
        var warmupSession: LlmInferenceSession? = null
        try {
            warmupSession = LlmInferenceSession.createFromOptions(llmInference, buildSessionOptions())
            warmupSession.addQueryChunk("warmup")
            val warmupFuture = warmupSession.generateResponseAsync(
                object : ProgressListener<String> {
                    override fun run(partialResult: String?, done: Boolean) {}
                }
            )
            try {
                warmupFuture.get(timeoutMs, TimeUnit.MILLISECONDS)
            } catch (e: TimeoutException) {
                warmupFuture.cancel(true)
                Log.w(TAG, "Warmup timed out after ${timeoutMs}ms")
            }
            Log.d(TAG, "Model warmup completed")
        } catch (e: Exception) {
            Log.w(TAG, "Warmup failed: ${e.message}")
        } finally {
            try {
                warmupSession?.close()
            } catch (_: Exception) {}
        }
    }

    fun closeModel() {
        try {
            llmInferenceSession.close()
            llmInference.close()
            Log.d(TAG, "Model closed successfully")
        } catch (e: Exception) {
            Log.w(TAG, "Error closing model: ${e.message}")
        }
    }

    companion object {
        private var instance: InferenceModel? = null
        @Synchronized
        fun getInstance(context: Context): InferenceModel {
            return instance ?: InferenceModel(context).also { instance = it }
        }
        fun resetInstance(context: Context) {
            try {
                instance?.closeModel()
            } catch (e: Exception) {
                Log.w(InferenceModel::class.qualifiedName, "Error resetting instance: ${e.message}")
            }
            instance = null
        }
        fun modelExists(context: Context): Boolean {
            val path = Model.QWEN2_0_5B_INSTRUCT.path
            return path.isNotEmpty() && java.io.File(path).exists()
        }
    }
}
