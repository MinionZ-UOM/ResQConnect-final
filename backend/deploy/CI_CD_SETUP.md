# Backend CI/CD Setup (GitHub Actions -> AWS ECR -> Server)

This setup gives fully automated backend deployment:

1. Push to `main`
2. GitHub Actions builds backend image
3. Image is pushed to ECR with immutable tag (`<commit-sha>`)
4. Workflow deploys to your server over SSH and restarts services

## 1. One-time Server Setup

Run on your Ubuntu server:

```bash
cd /opt
git clone <your-repo-url> resqconnect
cd /opt/resqconnect/backend
chmod +x deploy/bootstrap_server.sh
./deploy/bootstrap_server.sh
```

Then ensure Nginx + TLS for your domain are configured (from `DEPLOYMENT.md`).

## 2. Required GitHub Repository Variables

Create these in `Settings -> Secrets and variables -> Actions -> Variables`:

- `AWS_REGION` (example: `ap-southeast-1`)
- `ECR_REPOSITORY` (example: `minionz/resqconnect-backend`)
- `DEPLOY_PATH` (example: `/opt/resqconnect/backend`)

## 3. Required GitHub Repository Secrets

Create these in `Settings -> Secrets and variables -> Actions -> Secrets`:

- `AWS_GITHUB_ACTIONS_ROLE_ARN` (IAM role for GitHub OIDC)
- `DEPLOY_HOST` (server public IP or DNS)
- `DEPLOY_USER` (SSH user)
- `DEPLOY_SSH_KEY` (private key content)
- `APP_ENV_B64` (base64 of backend `.env.production`)
- `FIREBASE_CRED_B64` (base64 of `firebase_cred.json`)

Generate base64 values locally:

```bash
base64 -w 0 .env.production
base64 -w 0 app/secrets/firebase_cred.json
```

On macOS use:

```bash
base64 .env.production | tr -d '\n'
base64 app/secrets/firebase_cred.json | tr -d '\n'
```

## 4. AWS IAM for GitHub OIDC

Grant the GitHub OIDC role these minimum permissions:

- ECR read/write:
  - `ecr:GetAuthorizationToken`
  - `ecr:BatchCheckLayerAvailability`
  - `ecr:CompleteLayerUpload`
  - `ecr:InitiateLayerUpload`
  - `ecr:PutImage`
  - `ecr:UploadLayerPart`
  - `ecr:DescribeRepositories`
  - `ecr:CreateRepository`
- Optional metadata read:
  - `sts:GetCallerIdentity`

## 5. Deployment Behavior

Workflow file: `.github/workflows/backend-deploy.yml`

- Trigger: push to `main` when `backend/**` changes
- Build cache enabled via GitHub Actions cache
- Tags pushed:
  - `<ecr-registry>/<repo>:<commit-sha>`
  - `<ecr-registry>/<repo>:latest`
- Server always deploys commit-sha image, not mutable `latest`

## 6. Rollback

On server:

```bash
cd /opt/resqconnect/backend
echo "BACKEND_IMAGE=<ecr-registry>/<repo>:<old-commit-sha>" > .deploy.env
echo "COMPOSE_PROJECT_NAME=resqconnect" >> .deploy.env
docker compose --env-file .deploy.env -f docker-compose.prod.yml up -d
```
