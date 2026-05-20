FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew
COPY build.gradle settings.gradle .
RUN ./gradlew dependencies --no-daemon -q 2>/dev/null || true
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
