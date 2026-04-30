# Stage 1: Build the application using Maven and Eclipse Temurin JDK 17
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app
# Copy only the pom.xml first to leverage Docker cache
COPY pom.xml .
COPY src ./src
# Build the jar file
RUN mvn clean package -DskipTests

# Stage 2: Run the application using Eclipse Temurin JRE 17 (smaller and faster)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the jar from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the port
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]