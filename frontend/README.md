# Frontend Setup Guide

1.  **Open Terminal and Navigate to the Frontend Directory**
    -   If you're not already in the `frontend` directory, run the following command:
        ```bash
        cd frontend
        ```
2.  **Install Dependencies**
    -   Install the required npm packages by running:
        ```bash
        npm install
        ```
    -   If you encounter any error, try:
        ```bash
        npm install --force
        ```
3.  **Run the Application**
    -   Start the frontend development server:
        ```bash
        npm run dev
        ```
4.  **Add Environment Variables**

    Create a `.env.local` file in the `frontend` directory and define the following environment variables:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
    NEXT_PUBLIC_API=http://localhost:8000
    ```

---
