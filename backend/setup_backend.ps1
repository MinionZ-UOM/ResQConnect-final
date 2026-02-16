<#
    setup_backend.ps1
    Quick backend bootstrap for Windows (PowerShell ≥5).
    – Installs deps
    – Creates app\secrets
    – (Optionally) copies firebase_cred.json
    – Collects env-vars once
    – Spawns four consoles: FastAPI, Celery, DB-server, RAG-server
#>

param(
    # Path to the firebase credential if it sits elsewhere
    [string]$FirebaseCredPath = ".\firebase_cred.json"
)

Write-Host "`n=== Installing Python requirements ==="
pip install -r requirements.txt

# Ensure secrets folder exists
$secretsDir = "app\secrets"
if (!(Test-Path $secretsDir)) { New-Item -ItemType Directory -Path $secretsDir | Out-Null }

# Copy firebase creds if available
if (Test-Path $FirebaseCredPath) {
    Copy-Item $FirebaseCredPath "$secretsDir\firebase_cred.json" -Force
    Write-Host "✓ firebase_cred.json placed in $secretsDir"
} else {
    Write-Host "⚠ firebase_cred.json not found – drop it in $secretsDir before first run."
}

# Collect environment variables (stored only for this script run)
function Read-Plain($msg) { (Read-Host $msg).Trim() }
$env:GROQ_API_KEY        = Read-Plain "GROQ_API_KEY"
$env:LANGFUSE_SECRET_KEY = Read-Plain "LANGFUSE_SECRET_KEY"
$env:LANGFUSE_PUBLIC_KEY = Read-Plain "LANGFUSE_PUBLIC_KEY"
$env:LANGFUSE_HOST       = Read-Plain "LANGFUSE_HOST  (e.g. https://your-langfuse-host)"

Write-Host "`n=== Launching services in new terminals ==="

# FastAPI (hot-reload)
Start-Process powershell -ArgumentList "-NoExit","python -m uvicorn app.main:app --reload --timeout-keep-alive 30"

# Celery worker
Start-Process powershell -ArgumentList "-NoExit","celery -A app.celery_config.celery_app worker --loglevel=info --pool=solo"

# DB server
Start-Process powershell -ArgumentList "-NoExit","cd app/chatbot/mcp_servers/db ; python server.py"

# RAG server
Start-Process powershell -ArgumentList "-NoExit","cd app/chatbot/mcp_servers/rag ; python server.py"

Write-Host "`nAll done! Four windows should now be running (API, Celery, DB, RAG)."
Write-Host "If PowerShell blocks script execution, run once:`n  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned"
