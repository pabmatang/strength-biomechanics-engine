package com.mia.fitness.infrastructure.web.error;

/** Raised when the local Ollama runtime (chat or embeddings) cannot serve a request. */
public class AiUnavailableException extends RuntimeException {

    public AiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
