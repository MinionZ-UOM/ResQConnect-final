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

var MAX_TOKENS = 128
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
    private val conversationTurns = mutableListOf<ConversationTurn>()
    private val maxHistoryTurns = 20

    init {
        if (!modelExists(context)) throw IllegalArgumentException("Model not found at path: ${Model.QWEN2_0_5B_INSTRUCT.path}")
        createEngine(context)
        createSession()
    }

    private fun createEngine(context: Context) {
        val options = LlmInference.LlmInferenceOptions.builder()
            .setModelPath(Model.QWEN2_0_5B_INSTRUCT.path)
            .setMaxTokens(MAX_TOKENS)
            .setPreferredBackend(LlmInference.Backend.CPU)
            .build()
        try {
            llmInference = LlmInference.createFromOptions(context, options)
        } catch (e: Exception) {
            Log.e(TAG, "Load model error: ${e.message}", e)
            throw ModelLoadFailException()
        }
    }

    private fun createSession() {
        val sessionOptions = LlmInferenceSessionOptions.builder()
            .setTemperature(Model.QWEN2_0_5B_INSTRUCT.temperature)
            .setTopK(Model.QWEN2_0_5B_INSTRUCT.topK)
            .setTopP(Model.QWEN2_0_5B_INSTRUCT.topP)
            .build()
        try {
            llmInferenceSession = LlmInferenceSession.createFromOptions(llmInference, sessionOptions)
        } catch (e: Exception) {
            Log.e(TAG, "Session create error: ${e.message}", e)
            throw ModelSessionCreateFailException()
        }
    }

    @Synchronized
    private fun addTurn(role: String, content: String) {
        val normalized = content.trim()
        if (normalized.isEmpty()) return
        conversationTurns.add(ConversationTurn(role = role, content = normalized))
        // Bound in-memory conversation state to protect app-side prompt management.
        if (conversationTurns.size > maxHistoryTurns) {
            val toDrop = conversationTurns.size - maxHistoryTurns
            repeat(toDrop) { conversationTurns.removeAt(0) }
        }
    }

    fun generateResponseAsync(prompt: String, progressListener: ProgressListener<String>): ListenableFuture<String> {
        addTurn("user", prompt)
        llmInferenceSession.addQueryChunk(prompt)
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
        try {
            llmInferenceSession.close()
        } catch (e: Exception) {
            Log.w(TAG, "Error closing session: ${e.message}")
        }
        createSession()
        Log.d(TAG, "Session reset successfully")
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
