# Stage 1: Build stage with Maven and Eclipse Temurin JDK 21
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true

# Stage 2: Minimal Distroless / Temurin JRE 21 Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /app/target/strength-biomechanics-engine-*.jar app.jar

# JVM Flags optimized for Virtual Threads and low-latency GC (ZGC)
ENV JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational -XX:+UseStringDeduplication -Xms256m -Xmx1024m"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
