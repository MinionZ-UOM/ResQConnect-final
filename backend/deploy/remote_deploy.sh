#!/usr/bin/env bash
set -Eeuo pipefail

required_vars=(
  DEPLOY_PATH
  BACKEND_IMAGE
  ECR_REGISTRY
  ECR_PASSWORD
  APP_ENV_B64
  FIREBASE_CRED_B64
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}" >&2
    exit 1
  fi
done

docker_cmd=(docker)
if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1; then
    docker_cmd=(sudo docker)
  else
    echo "Docker is unavailable for this user and passwordless sudo is not configured." >&2
    exit 1
  fi
fi

mkdir -p "${DEPLOY_PATH}/app/secrets"
cd "${DEPLOY_PATH}"

if [[ ! -f docker-compose.prod.yml ]]; then
  echo "Missing ${DEPLOY_PATH}/docker-compose.prod.yml" >&2
  exit 1
fi

printf "%s" "${APP_ENV_B64}" | base64 --decode > .env.production
printf "%s" "${FIREBASE_CRED_B64}" | base64 --decode > app/secrets/firebase_cred.json
chmod 600 .env.production app/secrets/firebase_cred.json

cat > .deploy.env <<EOF
BACKEND_IMAGE=${BACKEND_IMAGE}
COMPOSE_PROJECT_NAME=resqconnect
EOF

printf "%s" "${ECR_PASSWORD}" | "${docker_cmd[@]}" login --username AWS --password-stdin "${ECR_REGISTRY}"

"${docker_cmd[@]}" compose --env-file .deploy.env -f docker-compose.prod.yml pull api worker
"${docker_cmd[@]}" compose --env-file .deploy.env -f docker-compose.prod.yml up -d --remove-orphans
"${docker_cmd[@]}" compose --env-file .deploy.env -f docker-compose.prod.yml ps

"${docker_cmd[@]}" image prune -af --filter "until=240h" || true
