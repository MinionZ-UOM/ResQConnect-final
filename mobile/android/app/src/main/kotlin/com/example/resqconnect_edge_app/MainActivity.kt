
package com.example.resqconnect_edge_app

import android.os.Bundle
import android.os.Environment
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel
import kotlinx.coroutines.*
import java.io.File
import java.net.URL
import android.content.Context

class MainActivity : FlutterActivity() {
    private val CHANNEL = "llm_inference"
    private val STREAM_CHANNEL = "llm_inference_stream"
    private var modelInstance: InferenceModel? = null

    private lateinit var mainChannel: MethodChannel
    private var streamSink: EventChannel.EventSink? = null
    private var inferenceStartMs: Long = 0
    private var firstTokenReceivedMs: Long = 0
    private var isFirstToken: Boolean = true

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Restore model path from SharedPreferences if available
        val prefs = getSharedPreferences("llm_prefs", Context.MODE_PRIVATE)
        val savedPath = prefs.getString("model_path", null)
        if (!savedPath.isNullOrEmpty()) {
            Model.QWEN2_0_5B_INSTRUCT.path = savedPath
        }
        mainChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
        // Stream channel for partial token delivery
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, STREAM_CHANNEL).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    android.util.Log.d("LLM_STREAM", "onListen called, setting up stream sink")
                    streamSink = events
                }

                override fun onCancel(arguments: Any?) {
                    android.util.Log.d("LLM_STREAM", "onCancel called, clearing stream sink")
                    streamSink = null
                }
            }
        )

        mainChannel.setMethodCallHandler { call, result ->
            when (call.method) {
                "downloadModel" -> {
                    GlobalScope.launch(Dispatchers.IO) {
                        val success = downloadModel()
                        runOnUiThread { result.success(success) }
                    }
                }
                "isModelDownloaded" -> {
                    result.success(isModelDownloaded())
                }
                "generateResponse" -> {
                    val prompt = call.argument<String>("prompt") ?: ""
                    if (modelInstance == null) {
                        modelInstance = InferenceModel.getInstance(this)
                    }
                    inferenceStartMs = System.currentTimeMillis()
                    firstTokenReceivedMs = 0
                    isFirstToken = true
                    android.util.Log.d("LLM_STREAM", "generateResponse started at $inferenceStartMs")
                    val responseFuture = modelInstance?.generateResponseAsync(
                        prompt,
                        object : com.google.mediapipe.tasks.genai.llminference.ProgressListener<String> {
                            override fun run(partialResult: String?, done: Boolean) {
                                val now = System.currentTimeMillis()
                                val delta = now - inferenceStartMs
                                
                                // Track first token arrival time
                                if (isFirstToken && !partialResult.isNullOrEmpty()) {
                                    firstTokenReceivedMs = now
                                    isFirstToken = false
                                    android.util.Log.d("LLM_STREAM", "First token received after $delta ms")
                                }
                                
                                // Stream partial results back to Flutter as they are generated
                                // Must run on main thread to safely update the stream sink
                                android.util.Log.d("LLM_STREAM", "ProgressListener called after $delta ms: done=$done, text='${partialResult?.take(50) ?: ""}'")
                                runOnUiThread {
                                    streamSink?.success(mapOf(
                                        "text" to (partialResult ?: ""),
                                        "done" to done,
                                        "firstTokenLatencyMs" to (if (firstTokenReceivedMs > 0) firstTokenReceivedMs - inferenceStartMs else 0)
                                    ))
                                }
                            }
                        }
                    )
                    GlobalScope.launch(Dispatchers.IO) {
                        try {
                            val res = responseFuture?.get() ?: ""
                            withContext(Dispatchers.Main) {
                                result.success(res)
                                modelInstance?.resetSession()
                            }
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                streamSink?.error("INFERENCE_ERROR", e.message, null)
                                result.error("INFERENCE_ERROR", e.message, null)
                            }
                        }
                    }
                }
                "getPublicDownloadsDirectory" -> {
                    result.success(getPublicDownloadsDirectory())
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun isModelDownloaded(): Boolean {
        val url = Model.QWEN2_0_5B_INSTRUCT.url
        val fileName = url.substringAfterLast("/")
        val destFile = File(filesDir, fileName)
        return destFile.exists()
    }


    private fun downloadModel(): Boolean {
        return try {
            val url = Model.QWEN2_0_5B_INSTRUCT.url
            val fileName = url.substringAfterLast("/")
            val destFile = File(filesDir, fileName)
            if (destFile.exists()) return true

            val connection = URL(url).openConnection()
            val totalBytes = connection.contentLengthLong
            connection.getInputStream().use { input ->
                destFile.outputStream().use { output ->
                    val buffer = ByteArray(8 * 1024)
                    var bytesRead: Int
                    var downloaded: Long = 0
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        downloaded += bytesRead
                        // Send progress update on main thread
                        runOnUiThread {
                            mainChannel.invokeMethod("downloadProgress", mapOf(
                                "downloaded" to downloaded,
                                "total" to totalBytes
                            ))
                        }
                    }
                }
            }

            // Update model path after download
            Model.QWEN2_0_5B_INSTRUCT.path = destFile.absolutePath
            // Save model path to SharedPreferences
            val prefs = getSharedPreferences("llm_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("model_path", destFile.absolutePath).apply()
            modelInstance = InferenceModel.getInstance(this)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    @Suppress("DEPRECATION")
    private fun getPublicDownloadsDirectory(): String? {
        return try {
            if (Environment.getExternalStorageState() != Environment.MEDIA_MOUNTED) {
                return null
            }
            val directory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            directory?.let {
                if (!it.exists()) {
                    it.mkdirs()
                }
            }
            directory?.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
