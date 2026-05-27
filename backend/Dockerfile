FROM gradle:9.4-jdk21 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle gradle
RUN gradle dependencies --no-daemon -q 2>/dev/null || true
COPY src src
RUN gradle bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
