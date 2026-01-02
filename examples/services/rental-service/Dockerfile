# Build stage - includes SDK build
FROM maven:3.9-eclipse-temurin-21-alpine AS build

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

# Now build the rental service
WORKDIR /app
COPY examples/services/rental-service/pom.xml .

# Download service dependencies (SDK now available in local repo)
RUN mvn dependency:go-offline -B

# Copy source code
COPY examples/services/rental-service/src src

# Build the application
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/rental-service-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
