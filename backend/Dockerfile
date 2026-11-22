FROM maven:3.9-eclipse-temurin-26-alpine@sha256:4c85d516dd8c7e50d49a403d604e565e0dbb09a790186fe3245725d313ae7cb9 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src src
ARG SOURCE_DATE_EPOCH
RUN --mount=type=cache,target=/root/.m2 test -n "$SOURCE_DATE_EPOCH" && mvn -B package -DskipTests -Dproject.build.outputTimestamp="$SOURCE_DATE_EPOCH"
FROM eclipse-temurin:21-jre-alpine@sha256:ac05c3c42b7c2f1a52c9bd52f01041fa1958231b15ebeae7420429cbc5baf474
WORKDIR /app
RUN addgroup -S -g 10001 jiayou && adduser -S -u 10001 -G jiayou jiayou
ARG RELEASE_SHA
RUN echo "$RELEASE_SHA" | grep -Eq '^[a-f0-9]{40}$'
LABEL org.opencontainers.image.source="https://github.com/thach09/jiayou" \
      org.opencontainers.image.revision="$RELEASE_SHA" \
      io.jiayou.deployment.contract="1" io.jiayou.component="backend"
USER 10001:10001
COPY --from=build /workspace/target/jiayou-backend-0.0.1-SNAPSHOT.jar app.jar
# Container port only; host bindings and JVM budgets are operator-owned.
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
