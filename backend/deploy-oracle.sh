#!/usr/bin/env bash
# ==============================================================================
# Strength & Biomechanics Engine (CHΔNCE) — Despliegue en Oracle Cloud (ARM64)
# Probado en Ubuntu 22.04 / 24.04 LTS (Ampere A1 Flex).
#
# Uso, desde cualquier ruta dentro del repositorio:
#   chmod +x backend/deploy-oracle.sh
#   ./backend/deploy-oracle.sh
#
# El script levanta el docker-compose de la RAÍZ del repositorio
# (postgres + ollama + backend + frontend).
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🚀 Desplegando Strength & Biomechanics Engine desde $REPO_ROOT"

if ! command -v docker &> /dev/null; then
  echo "📦 Instalando Docker Engine..."
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "✅ Docker instalado. Si es la primera vez, cierra sesión y vuelve a entrar"
  echo "   para aplicar el grupo docker, o ejecuta el script con sudo."
fi

# Firewall del sistema operativo. En Oracle Cloud hay que abrir además estos
# puertos en la Security List / NSG de la instancia.
echo "🛡️ Abriendo puertos 80, 443 y 3000 en iptables..."
sudo iptables -I INPUT -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo iptables -I INPUT -m state --state NEW -p tcp --dport 3000 -j ACCEPT || true
sudo netfilter-persistent save || true

# Configuración: nunca se versiona el .env real.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Se ha creado .env a partir de .env.example."
  echo "   Edita JWT_SECRET_KEY (mínimo 32 bytes) antes de exponer el servicio:"
  echo "     openssl rand -base64 48"
fi

if grep -q '^JWT_SECRET_KEY=cambia-esto' .env; then
  echo "⚠️  JWT_SECRET_KEY sigue siendo el valor de ejemplo. Cámbialo antes de publicar."
fi

echo "🐳 Construyendo y levantando contenedores..."
docker compose build
docker compose up -d

# Ollama no descarga modelos automáticamente: sin ellos el escaneo y la
# búsqueda semántica responden 503.
echo "🧠 Descargando modelos de Ollama (puede tardar varios minutos)..."
docker compose exec -T ollama ollama pull llama3.2-vision
docker compose exec -T ollama ollama pull nomic-embed-text

echo "🔄 Reiniciando el backend para sembrar los embeddings del catálogo..."
docker compose restart backend

echo "⏳ Esperando a que la API esté sana..."
for attempt in $(seq 1 30); do
  if curl -fsS http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ API disponible."
    break
  fi
  if [ "$attempt" -eq 30 ]; then
    echo "❌ La API no respondió a tiempo. Revisa: docker compose logs backend"
    exit 1
  fi
  sleep 5
done

PUBLIC_IP="$(curl -s https://ifconfig.me || echo '<IP-de-la-instancia>')"

echo ""
echo "================================================================================"
echo "🎉 DESPLIEGUE COMPLETADO"
echo "================================================================================"
echo " - Frontend (Nginx):    http://${PUBLIC_IP}:3000"
echo " - API Spring Boot:     http://${PUBLIC_IP}:8080"
echo " - Swagger UI:          http://${PUBLIC_IP}:8080/swagger-ui.html"
echo " - Health:              http://${PUBLIC_IP}:8080/actuator/health"
echo ""
echo "PostgreSQL y Ollama solo escuchan en 127.0.0.1 de la instancia."
echo "Recuerda abrir 3000/8080 en la Security List de Oracle Cloud y poner HTTPS"
echo "(por ejemplo, un reverse proxy en 443) antes de usar credenciales reales."
echo "================================================================================"
