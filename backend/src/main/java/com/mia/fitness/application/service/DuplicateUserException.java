package com.mia.fitness.application.service;

/** Raised when a username or email is already registered. */
public class DuplicateUserException extends RuntimeException {

    public DuplicateUserException(String message) {
        super(message);
    }
}
