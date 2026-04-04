
package com.example.resqconnect_edge_app

import android.os.Bundle
import android.os.Environment
import com.google.common.util.concurrent.FutureCallback
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.MoreExecutors
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import kotlinx.coroutines.*
import java.io.File
import java.net.URL
import android.content.Context
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : FlutterActivity() {
    private val CHANNEL = "llm_inference"
    private var modelInstance: InferenceModel? = null
    private val inferenceInFlight = AtomicBoolean(false)
    private val modelReady = AtomicBoolean(false)
    private val warmupInFlight = AtomicBoolean(false)
    private val activityScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val enableStartupPrewarm = false

    private lateinit var mainChannel: MethodChannel

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Restore model path from SharedPreferences if available
        val prefs = getSharedPreferences("llm_prefs", Context.MODE_PRIVATE)
        val savedPath = prefs.getString("model_path", null)
        if (!savedPath.isNullOrEmpty()) {
            Model.QWEN2_0_5B_INSTRUCT.path = savedPath
        }
        mainChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
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
                "isModelReady" -> {
                    result.success(modelReady.get())
                }
                "generateResponse" -> {
                    val prompt = call.argument<String>("prompt") ?: ""
                    if (!inferenceInFlight.compareAndSet(false, true)) {
                        result.error("INFERENCE_BUSY", "Inference is already in progress.", null)
                        return@setMethodCallHandler
                    }
                    try {
                        if (modelInstance == null) {
                            modelInstance = InferenceModel.getInstance(this)
                        }

                        val responseFuture = modelInstance?.generateResponseAsync(
                            prompt,
                            object : com.google.mediapipe.tasks.genai.llminference.ProgressListener<String> {
                                override fun run(partialResult: String?, done: Boolean) {
                                    runOnUiThread {
                                        try {
                                            mainChannel.invokeMethod(
                                                "inferenceProgress",
                                                mapOf(
                                                    "text" to (partialResult ?: ""),
                                                    "done" to done
                                                )
                                            )
                                        } catch (_: Exception) {
                                            // Keep generation resilient even if UI is not listening.
                                        }
                                    }
                                }
                            }
                        )

                        if (responseFuture == null) {
                            inferenceInFlight.set(false)
                            result.error("INFERENCE_UNAVAILABLE", "Inference engine is unavailable.", null)
                            return@setMethodCallHandler
                        }

                        Futures.addCallback(
                            responseFuture,
                            object : FutureCallback<String> {
                                override fun onSuccess(responseText: String?) {
                                    runOnUiThread {
                                        inferenceInFlight.set(false)
                                        modelReady.set(true)
                                        result.success(responseText ?: "")
                                    }
                                }

                                override fun onFailure(t: Throwable) {
                                    runOnUiThread {
                                        inferenceInFlight.set(false)
                                        result.error("INFERENCE_ERROR", t.message, null)
                                    }
                                }
                            },
                            MoreExecutors.directExecutor()
                        )
                    } catch (e: Exception) {
                        inferenceInFlight.set(false)
                        result.error("INFERENCE_INIT_ERROR", e.message, null)
                    }
                }
                "getPublicDownloadsDirectory" -> {
                    result.success(getPublicDownloadsDirectory())
                }
                else -> result.notImplemented()
            }
        }

        if (enableStartupPrewarm && InferenceModel.modelExists(this)) {
            prewarmModelAsync()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        activityScope.cancel()
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
            InferenceModel.resetInstance(this)
            modelInstance = null
            modelReady.set(false)
            if (enableStartupPrewarm) {
                prewarmModelAsync()
            }
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

    private fun prewarmModelAsync() {
        if (!warmupInFlight.compareAndSet(false, true)) return
        activityScope.launch(Dispatchers.IO) {
            try {
                val instance = InferenceModel.getInstance(this@MainActivity)
                modelInstance = instance
                instance.warmup()
                modelReady.set(true)
            } catch (e: Exception) {
                modelReady.set(false)
            } finally {
                warmupInFlight.set(false)
            }
        }
    }
}
