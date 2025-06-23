
# ChatNap - AI Customer Service

A comprehensive multi-agent customer service platform for modern beauty services.

---

## 🧩 Project Structure

### 🔹 Frontend

* **UI**: Customer-facing chat interface (Next.js)
* **Dashboard**: Admin portal for appointments and customer management (React)

### 🔹 AI Customer Service (Backend)

Built with [Google Agent Development Kit (ADK)](https://github.com/google/adk), featuring multiple agents:

* **Support Agent**: Greets users and handles common inquiries
* **RAG Agent**: Retrieves knowledge and answers FAQs
* **Booking Agent**: Schedules appointments and manages calendars
* **Portfolio Agent**: Analyzes uploaded images for style matching (e.g. nail art)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Applications                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Customer UI   │    │      Admin Dashboard           │ │
│  │                 │    │                                │ │
│  │ • Chat Interface│    │ • Appointment Management      │ │
│  │ • Booking Form  │    │ • Customer Analytics         │ │
│  │ • Image Upload  │    │ • Service Portfolio          │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Customer Service (ADK)                     │
├─────────────────────────────────────────────────────────────┤
│                    Dispatch Agent                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Support   │ │     RAG     │ │   Booking   │ │Portfolio│ │
│  │   Agent     │ │   Agent     │ │   Agent     │ │ Agent   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 🔧 Prerequisites

* Node.js ≥ 16 (for frontend)
* Python ≥ 3.9 (for backend)
* [Google ADK](https://github.com/google/adk): `pip install google-adk`
* PostgreSQL or [Supabase](https://supabase.com/)

---

## ⚙️ Installation

### 1. Install Frontend Dependencies

```bash
# Customer UI
cd frontend/UI
npm install

# Admin Dashboard
cd frontend/dashboard-project-main
npm install
```

### 2. Install Backend (AI Service) Dependencies

```bash
pip install -r requirements.txt 
```

### 3. Setup Environment Variables

```bash
# Copy template
cp env.example .env.local
```

Update `.env.local` with:

```env
GOOGLE_API_KEY=your_google_api_key
DATABASE_URL=postgresql://username:password@host:port/database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RAG_CORPUS=projects/your-project-id/locations/us-central1/ragCorpora/your-corpus-id
```

---

## ▶️ Running the Application

### 1. Start AI Service (ADK API Server)

```bash
adk api_server \
  --session_db_url="postgresql://user:pass@your-db-host:5432/postgres" \
  --allow_origins="http://localhost:3000" \
  --host="0.0.0.0" \
  --port=8000
```

### 2. Start Frontend Applications

```bash
# Customer UI (http://localhost:3000)
cd frontend/UI
npm run dev

# Admin Dashboard (http://localhost:3001)
cd frontend/dashboard-project-main
npm run dev -- --port 3001
```

### 3. Optional: ADK Web Interface for Debugging

```bash
adk web
# select 'ai_customer_service'
```

---

## 🎯 Key Features

### 🤖 AI Backend

* **Multi-agent architecture** for task specialization
* **Intelligent dispatching** to route requests to appropriate agents
* **Supabase/PostgreSQL integration** for appointments and sessions
* **Vision-based agent** for image analysis (e.g., nail art matching)
* **Streaming and persistent sessions** via ADK

### 💻 Frontend

* **Real-time Chat**: WebSocket-powered chat interface
* **Modern Design**: Built with React, Next.js, Tailwind CSS
* **Image Upload**: Customers can submit reference styles
* **Admin Tools**: Analytics, bookings, and service management


> *Built with ❤️ using Google Agent Development Kit — for the next generation of AI-powered customer service.*

---

