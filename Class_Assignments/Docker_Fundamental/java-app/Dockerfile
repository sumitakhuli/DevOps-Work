# Official Eclipse Temurin JDK base image.
# NOTE: the old `openjdk:*` images are deprecated and no longer published,
# so `eclipse-temurin` is the current official OpenJDK distribution.
FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

# Copy the source in
COPY Main.java ./

# Compile at image build time, so the container starts fast
RUN javac Main.java

EXPOSE 8080

# Run the compiled class
CMD ["java", "Main"]
