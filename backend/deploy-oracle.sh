#!/usr/bin/env bash
# ==============================================================================
# CHΔNCE Engine — Script de Despliegue 24/7 Automatizado para Oracle Cloud (ARM64)
# Compatible con Ubuntu 22.04 / 24.04 LTS (Ampere A1 Flex - 4 OCPU, 24GB RAM)
# ==============================================================================

set -e

echo "🚀 Iniciando despliegue de CHΔNCE Engine en Oracle Cloud..."

# 1. Actualizar sistema e instalar dependencias básicas
echo "📦 Actualizando paquetes de Ubuntu..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git iptables-persistent

# 2. Instalar Docker y Docker Compose oficial para arquitectura ARM64 (aarch64)
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker Engine para ARM64..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado correctamente."
else
    echo "✅ Docker ya está instalado."
fi

# 3. Configurar cortafuegos iptables de Oracle Cloud
echo "🛡️ Configurando reglas de cortafuegos para puertos 80, 443 y 8080..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT || true
sudo netfilter-persistent save || true

# 4. Levantar los contenedores de CHΔNCE (PostgreSQL + pgvector, Spring Boot, Ollama)
echo "🚀 Levantando contenedores con Docker Compose..."
docker compose pull || true
docker compose build
docker compose up -d

echo ""
echo "================================================================================"
echo "🎉 ¡DESPLIEGUE COMPLETADO CON ÉXITO EN ORACLE CLOUD!"
echo "================================================================================"
echo "Servicios activos:"
echo " - Backend Spring Boot 3.3 API: http://$(curl -s ifconfig.me):8080"
echo " - OpenAPI / Swagger UI:        http://$(curl -s ifconfig.me):8080/swagger-ui.html"
echo " - PostgreSQL con pgvector:     puerto 5432"
echo " - Ollama Local IA:             puerto 11434"
echo "================================================================================"
