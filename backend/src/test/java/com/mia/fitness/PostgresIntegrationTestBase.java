package com.mia.fitness;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Singleton Testcontainers base class. The container is started once per test JVM and
 * reused by every integration test, which keeps {@code mvn verify} fast.
 *
 * <p>Flyway creates the schema (including {@code CREATE EXTENSION vector}) when the
 * Spring context boots against this datasource, so the tests always run against the same
 * migrations as production.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class PostgresIntegrationTestBase {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("pgvector/pgvector:pg16")
    )
            .withDatabaseName("mia_fitness_test")
            .withUsername("postgres")
            .withPassword("postgres");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Never call Ollama from tests.
        registry.add("app.knowledge-base.seed", () -> "false");
    }
}
