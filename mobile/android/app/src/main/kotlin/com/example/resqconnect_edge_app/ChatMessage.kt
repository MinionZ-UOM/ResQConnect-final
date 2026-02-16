
package com.example.resqconnect_edge_app

import java.util.UUID

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val rawMessage: String = "",
    val author: String,
    val isLoading: Boolean = false,
    val isThinking: Boolean = false,
)
