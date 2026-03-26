#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/resqconnect/backend}"
DEPLOY_USER="${DEPLOY_USER:-$USER}"

if [[ "${EUID}" -eq 0 ]]; then
  echo "Run this script as a regular sudo-capable user, not root." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-plugin
  sudo systemctl enable --now docker
fi

if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y nginx
  sudo systemctl enable --now nginx
fi

sudo mkdir -p "${DEPLOY_PATH}/app/secrets"
sudo chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_PATH}"

if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow OpenSSH || true
  sudo ufw allow 80/tcp || true
  sudo ufw allow 443/tcp || true
fi

if id -nG "${DEPLOY_USER}" | grep -qw docker; then
  echo "User ${DEPLOY_USER} is already in docker group."
else
  sudo usermod -aG docker "${DEPLOY_USER}"
  echo "Added ${DEPLOY_USER} to docker group. Re-login once for group changes to apply."
fi

echo "Server bootstrap complete."
echo "Next: configure Nginx + HTTPS, then run GitHub Actions deployment."
