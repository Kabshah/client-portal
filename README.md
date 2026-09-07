# Client Onboarding Portal

A comprehensive full-stack solution for managing the client onboarding process.

## Architecture

This project is structured as a monorepo containing:
- **Frontend (`/frontend`)**: A modern, responsive web application built with Next.js, React, and Tailwind CSS. Provides interfaces for both clients (proposal submission) and administrators (submission management).
- **Backend (`/backend`)**: A high-performance RESTful API built with Go and the Fiber framework. It handles data persistence, business logic, email notifications, and integrations.

---

## Getting Started

Follow these simple steps to set up the project locally. Even if you come back to this after years, these steps will help you get it running quickly!

### 1. Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **Go** (v1.21 or higher)
- **PostgreSQL** (Running locally or via Docker)

### 2. Clone the Repository
```bash
git clone https://github.com/Kabshah/client-portal.git
cd client-portal
```

### 3. Setup the Backend
The backend is built with Go and requires a PostgreSQL database.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create an environment file by copying the example:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your details (especially `DATABASE_URL` and `SMTP` settings). The `.env.example` has comments explaining what is required and what is optional.
4. Download dependencies and run the server:
   ```bash
   go mod download
   
   # Run using Air (for hot-reloading in development)
   air
   
   # Or run using standard Go command
   go run ./cmd/api
   ```
   *The backend should now be running on `http://localhost:8080`.*

### 4. Setup the Frontend
The frontend is a Next.js application.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create an environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies and run the development server:
   ```bash
   npm install
   npm run dev
   ```
   *The frontend should now be running on `http://localhost:3000`.*

---

## Deployment & Production
- **Frontend**: Ensure you set the `NEXT_PUBLIC_API_BASE_URL` environment variable.
- **Backend**: Can be compiled into a binary (`go build -o app ./cmd/api`)
- **Database**: Use a managed PostgreSQL instance.

---

## Workflow Automation (n8n)

This project integrates with **n8n** for automated workflows (like processing readiness emails or syncing data). 

1. Install and run n8n (via Docker or desktop app).
2. Import the provided `n8n_template.json` file found in the root directory into your n8n workspace.
3. Configure the webhook nodes inside n8n to generate a **Test Webhook URL** or **Production Webhook URL**.
4. Copy the webhook URL and paste it into your backend `.env` file under `N8N_WEBHOOK_URL`.
5. Activate the workflow in n8n.