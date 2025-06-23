# Frontend & AI Customer Service

This repository contains two main components for a comprehensive beauty service platform:

## Frontend
- **UI**: Main customer-facing chat interface built with Next.js
- **Dashboard**: Admin dashboard for managing appointments and customer data built with React

## AI Customer Service
Multi-agent customer service system built with **Google Agent Development Kit (ADK)** featuring specialized agents for:
- **Support Agent**: Greetings and basic customer inquiries
- **RAG Agent**: Knowledge retrieval and FAQ responses  
- **Booking Agent**: Appointment scheduling and calendar management
- **Portfolio Agent**: Image analysis and style matching for nail art services

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

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (for frontend)
- Python 3.9+ (for AI service)
- Google ADK (\`pip install google-adk\`)
- PostgreSQL/Supabase database

### Installation

1. **Install frontend dependencies**:
\`\`\`bash
# Customer UI
cd frontend/UI
npm install

# Admin Dashboard  
cd frontend/ashboard-project-main
npm install
\`\`\`

2. **Install AI service dependencies**:
\`\`\`bash
pip install google-adk psycopg2-binary python-dotenv
\`\`\`

3. **Environment setup**:
\`\`\`bash
# Copy environment template
cp env.example .env.local

# Configure your environment variables:
GOOGLE_API_KEY=your_google_api_key
DATABASE_URL=postgresql://username:password@host:port/database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### Running the Application

#### 1. Start the AI Service (ADK API Server)
\`\`\`bash
# Production mode with database session management
adk api_server \\
  --session_db_url="postgresql://postgres:password@your-db-host:5432/postgres" \\
  --allow_origins="http://localhost:3000" \\
  --host="0.0.0.0" \\
  --port=8000
\`\`\`

#### 2. Start Frontend Applications
\`\`\`bash
# Customer UI (Port 3000)
cd frontend/UI
npm run dev

# Admin Dashboard (Port 3001)  
cd frontend/ashboard-project-main
npm run dev -- --port 3001
\`\`\`

#### 3. Development Mode (ADK Web UI)
\`\`\`bash
# For development and debugging
adk web
# Visit http://localhost:8000 and select 'ai_customer_service'
\`\`\`

## 🎯 Key Features

### AI Customer Service (ADK)
- **Multi-Agent Architecture**: Specialized agents for different customer needs
- **Intelligent Routing**: Automatic request classification and agent selection
- **Database Integration**: PostgreSQL/Supabase for appointment management
- **Image Analysis**: AI-powered nail art style recognition
- **Session Management**: Persistent conversation context
- **Real-time Processing**: Streaming responses with ADK

### Frontend Applications
- **Modern UI**: Built with Next.js, React, and Tailwind CSS
- **Real-time Chat**: WebSocket integration for instant messaging
- **Image Upload**: Direct image upload for style analysis
- **Responsive Design**: Mobile-friendly interface
- **Admin Dashboard**: Comprehensive management interface

## 📚 Documentation

- [AI Customer Service Documentation](./ai_customer_service/README.md)
- [Google ADK Official Docs](https://google.github.io/adk-docs/)
- [Frontend UI Guide](./frontend/UI/README.md)
- [Admin Dashboard Guide](./frontend/ashboard-project-main/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 🔗 Links

- [Google ADK GitHub](https://github.com/google/adk)
- [Vertex AI Agent Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

*Built with Google Agent Development Kit | Designed for Modern Customer Service*
