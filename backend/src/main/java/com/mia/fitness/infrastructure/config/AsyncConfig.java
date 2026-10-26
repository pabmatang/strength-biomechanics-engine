package com.mia.fitness.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Configuración de concurrencia que registra el ExecutorService de Virtual Threads (Project Loom)
 * como un bean gestionado por Spring, asegurando su apagado elegante (graceful shutdown)
 * cuando el ApplicationContext se cierra.
 *
 * Java 21: Executors.newVirtualThreadPerTaskExecutor() crea hilos virtuales bajo demanda,
 * evitando la limitación de pools fijos y permitiendo miles de tareas concurrentes con
 * overhead de memoria de ~1 KB por hilo (vs ~1 MB de un platform thread).
 */
@Configuration
public class AsyncConfig {

    @Bean(destroyMethod = "close")
    public ExecutorService virtualThreadExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
