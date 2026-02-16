package com.example.resqconnect_edge_app

import android.content.Context
import android.util.Log
import com.google.common.util.concurrent.ListenableFuture
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession.LlmInferenceSessionOptions
import com.google.mediapipe.tasks.genai.llminference.ProgressListener

var MAX_TOKENS = 128
var DECODE_TOKEN_OFFSET = 256

class ModelLoadFailException : Exception("Failed to load model, please try again")
class ModelSessionCreateFailException : Exception("Failed to create model session, please try again")

class InferenceModel private constructor(context: Context) {
    private lateinit var llmInference: LlmInference
    private lateinit var llmInferenceSession: LlmInferenceSession
    private val TAG = InferenceModel::class.qualifiedName

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

    fun generateResponseAsync(prompt: String, progressListener: ProgressListener<String>): ListenableFuture<String> {
        llmInferenceSession.addQueryChunk(prompt)
        return llmInferenceSession.generateResponseAsync(progressListener)
    }

    companion object {
        private var instance: InferenceModel? = null
        fun getInstance(context: Context): InferenceModel {
            return instance ?: InferenceModel(context).also { instance = it }
        }
        fun modelExists(context: Context): Boolean {
            val path = Model.QWEN2_0_5B_INSTRUCT.path
            return path.isNotEmpty() && java.io.File(path).exists()
        }
    }
}
