# Backend Setup Guide

## Prerequisites

### General / Manual Setup
- Python 3.7 or above installed
- A virtual environment configured in the `backend` directory

### Docker Setup
- [Docker](https://www.docker.com/get-started) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

---

## Docker Setup

1.  **Open Terminal and Navigate to the Backend Directory**
    ```bash
    cd backend
    ```

2.  **Add Environment Variables**
    Create a `.env` file in the `backend` directory with the following variables:
    ```env
    GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/firebase_cred.json
    GOOGLE_APPLICATION_CREDENTIALS_MCP=secrets/firebase_cred.json
    GROQ_API_KEY=your_api_key
    LANGFUSE_SECRET_KEY=""
    LANGFUSE_PUBLIC_KEY=""
    LANGFUSE_HOST=""
    ```
    *Note: The `GOOGLE_APPLICATION_CREDENTIALS` path (`/app/secrets/...`) is specifically for the Docker container.*

3.  **Setup Secrets**
    -   Create a folder named `secrets` inside the `app` folder.
    -   Place your `firebase_cred.json` file inside `app/secrets/`.
    -   This file is mounted into the container to allow Firestore access.

4.  **Run the Application**
    -   Build and start the services (API and Celery Worker) using Docker Compose:
        ```bash
        docker-compose up --build
        ```
    -   The API will be available at `http://localhost:8000`.

---

## Manual Setup Steps

1.  **Open Terminal and Navigate to the Backend Directory**
    -   If you're not already in the `backend` directory, run the following command:
        ```bash
        cd backend
        ```
2.  **Add Environment Variables**

    Create a `.env` file in the `backend` directory and define the following environment variables:

    ```env
    GOOGLE_APPLICATION_CREDENTIALS=app/secrets/firebase_cred.json
    GOOGLE_APPLICATION_CREDENTIALS_MCP=secrets/firebase_cred.json
    GROQ_API_KEY=your_api_key
    LANGFUSE_SECRET_KEY=""
    LANGFUSE_PUBLIC_KEY=""
    LANGFUSE_HOST=""
    ```
    *Note: For manual setup, ensure `GOOGLE_APPLICATION_CREDENTIALS` points to the local path (e.g., `app/secrets/...`).*

3.  **Create Virtual Environment**
    -   Create a virtual environment if you don't have one installed:
        ```bash
        python -m venv env
        ```

4.  **Activate the Virtual Environment**
    -   Activate the virtual environment using the following command (Windows):
        ```bash
        .\env\Scripts\activate
        ```
    -   For macOS/Linux, use:
        ```bash
        source env/bin/activate
        ```
5.  **OPTIONAL Script to start all the services at once**
    -   You can start all the services required for the backend (celery worker, MCP servers and FAST API) try running the following script if it fails follow the given steps :
        ```bash
         .\setup_backend.ps1
        ```

6.  **Install Dependencies**
    -   Install the required Python packages by running:
        ```bash
        pip install -r requirements.txt
        ```
7.  **Create a folder named `secrets` inside the `app` folder and place the `firebase_cred.json` file inside it.**
    -   This is required to access Firestore from the backend.

8.  **Run the Application**
    -   Start the backend server with hot-reloading enabled:
        ```bash
        python -m uvicorn app.main:app --reload
        ```

---

## Setting up Celery with Redis

This project uses [Celery](https://docs.celeryq.dev/en/stable/) for asynchronous task processing and [Redis](https://redis.io/) as the message broker.

### Environment Variables

Before running the worker, set the following environment variables in your **terminal session**.

```powershell
$env:GROQ_API_KEY         = "your-groq-api-key-here"
$env:LANGFUSE_SECRET_KEY  = "your-langfuse-secret-key-here"
$env:LANGFUSE_PUBLIC_KEY  = "your-langfuse-public-key-here"
$env:LANGFUSE_HOST        = "https://your-langfuse-host-url"
```

**Note that you need to be inside the backend directory and your virtual environment should be activated.**
Then start the Celery worker:

```powershell
celery -A app.celery_config.celery_app worker --loglevel=info --pool=solo
```

---

## Automated AWS Deployment (ECR + GitHub Actions)

- Production compose file: `backend/docker-compose.prod.yml`
- CI/CD workflow: `.github/workflows/backend-deploy.yml`
- Deployment scripts: `backend/deploy/`

Setup guide:

- `backend/deploy/CI_CD_SETUP.md`
