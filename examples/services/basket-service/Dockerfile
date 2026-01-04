# Build stage - includes SDK build
FROM maven:3.9-eclipse-temurin-25-alpine AS build

# First, build the SPAS SDK
WORKDIR /sdk
COPY components/sdk/java/pom.xml .
COPY components/sdk/java/spas-sdk-core spas-sdk-core
COPY components/sdk/java/spas-sdk-metadata spas-sdk-metadata
COPY components/sdk/java/spas-sdk-metadata-processor spas-sdk-metadata-processor
COPY components/sdk/java/spas-sdk-events spas-sdk-events
COPY components/sdk/java/spas-sdk-spring spas-sdk-spring
COPY components/sdk/java/spas-sdk-observability spas-sdk-observability

# Install SDK to local Maven repository
RUN mvn install -DskipTests -B -q

# Now build the basket service
WORKDIR /app
COPY examples/services/basket-service/pom.xml .

# Download service dependencies (SDK now available in local repo)
RUN mvn dependency:go-offline -B

# Copy source code
COPY examples/services/basket-service/src src

# Build the application
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S spas && adduser -S spas -G spas
USER spas

# Copy the built JAR
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
