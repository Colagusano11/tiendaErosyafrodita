#!/bin/bash
set -e

echo "🚀 Desplegando integración Idealo para Eros y Afrodita..."

# Verificar que estamos en el directorio correcto
cd /home/ventas/eros-afrodita-web

# Detener contenedores actuales
echo "🛑 Deteniendo contenedores actuales..."
docker-compose down

# Construir el backend con Maven (usando Docker para evitar problemas de Java)
echo "🔨 Construyendo backend..."
cd tiendaBack
# Usar Docker para compilar si Maven local falla
if ! mvn clean package -DskipTests 2>/dev/null; then
    echo "⚠️ Maven local falló, usando Docker para compilar..."
    docker run --rm \
        -v "$(pwd)":/app \
        -v ~/.m2:/root/.m2 \
        -w /app \
        maven:3.9-eclipse-temurin-21 \
        mvn clean package -DskipTests
fi
cd ..

# Construir el frontend
echo "🔨 Construyendo frontend..."
cd erosyafrodita
npm install
npm run build
cd ..

# Iniciar contenedores
echo "🚀 Iniciando contenedores..."
docker-compose up -d --build

# Verificar estado
echo "✅ Verificando despliegue..."
sleep 5
docker-compose ps

echo "🎉 Despliegue completado!"
echo "📱 Acceso: https://erosyafrodita.com/admin/idealo"
echo "📚 API Backend: http://localhost:8082/api/idealo/status"