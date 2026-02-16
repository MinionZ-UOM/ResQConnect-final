
package com.example.resqconnect_edge_app

enum class Model(
    var path: String,
    val url: String,
    val temperature: Float,
    val topK: Int,
    val topP: Float
) {
    QWEN2_0_5B_INSTRUCT(
        path = "", // Will be set after download
        url = "https://huggingface.co/veejask/ResQEdge/resolve/main/qwen.task",
        temperature = 0.95f,
        topK = 40,
        topP = 1.0f
    )
}
