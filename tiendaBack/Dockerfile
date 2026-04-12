# Fase 1: Compilación
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Fase 2: Ejecución
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Instalar Python y dependencias necesarias
RUN apk add --no-cache python3 py3-pip \
    && pip install --no-cache-dir requests mysql-connector-python --break-system-packages

COPY --from=build /app/target/tiendaonline*.jar app.jar
# Copiar las herramientas (scripts de IA/Media)
COPY tools/ ./tools/

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]