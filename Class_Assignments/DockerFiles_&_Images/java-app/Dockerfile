# ---------- Stage 1: compile with the full JDK ----------
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY Main.java ./
RUN javac -d out Main.java

# ---------- Stage 2: run on the smaller JRE ----------
# The JRE cannot compile, only run. Since compilation already
# happened in stage 1, the final image does not need javac.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/out ./
ENV PORT=8080
EXPOSE 8080
CMD ["java", "Main"]
