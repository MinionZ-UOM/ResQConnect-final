# ResQConnect

## Project Structure

The codebase is organized into three main components:

-   **`backend/`**: A robust API using FastAPI, managing data, authentication, and AI services.
-   **`frontend/`**: A modern web interface built with Next.js and Tailwind CSS for users and administrators.
-   **`mobile/`**: A cross-platform mobile application developed with Flutter for on-the-go access.

## Tech Stack

### Backend
-   **Framework**: FastAPI 
-   **Asynchronous Tasks**: Celery with Redis
-   **AI & LLM Integration**: Langfuse, OpenAI
-   **Database**: Firestore 
-   **Containerization**: Docker

### Frontend
-   **Framework**: Next.js 
-   **Styling**: Tailwind CSS, Radix UI
-   **State Management**: React Query, Context API
-   **Authentication**: Firebase Auth

### Mobile
-   **Framework**: Flutter 
-   **State Management**: Provider
-   **Maps**: Location services integrated

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:
-   **Node.js** (v18+ recommended)
-   **Python** (v3.9+)
-   **Flutter SDK**
-   **Docker** & **Docker Compose** (optional, for containerized backend)

### 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

**Manual Setup:**
1.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Set up environment variables (see [Environment Configuration](#environment-configuration)).
4.  Run the server:
    ```bash
    uvicorn app.main:app --reload
    ```

**Docker Setup:**
```bash
docker-compose up --build
```

### 2. Frontend Setup

Navigate to the `frontend` directory:
```bash
cd frontend
```

1.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
2.  Set up environment variables.
3.  Run the development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Mobile Setup

Navigate to the `mobile` directory:
```bash
cd mobile
```

1.  Get dependencies:
    ```bash
    flutter pub get
    ```
2.  Run the app (ensure an emulator is running or a device is connected):
    ```bash
    flutter run
    ```

---

## Environment Configuration

Each component requires specific environment variables. Create a `.env` file in the respective directories.

### Backend (`backend/.env`)
```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase_cred.json
GROQ_API_KEY=your_groq_api_key
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Frontend (`frontend/.env.local`)
Refer to `frontend/README.md` or source code for specific keys required (e.g., Firebase config).

---