# Context AI - Knowledge-Aware Conversational Platform

A production-ready, context-aware conversational web application that leverages graph databases for user-specific context retrieval and LLM-based agents for intelligent, contextualized responses.

## Features

- **Context-Aware Chat**: Intelligent responses based on your personal knowledge graph
- **Graph Database Integration**: Neo4j-powered context retrieval with multi-hop traversal
- **Real-time Streaming**: Server-sent events for smooth response streaming
- **Context Visualization**: Interactive panel showing retrieved context nodes
- **User Authentication**: Secure JWT-based session management
- **Rate Limiting**: Redis-powered request throttling
- **Modern UI**: Futuristic design with Tailwind CSS v4, Motion animations

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **State Management**: Zustand, TanStack Query
- **Backend**: Next.js API Routes, Neo4j, Redis
- **AI**: Anthropic Claude 4.5 Sonnet API
- **Infrastructure**: Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose
- Anthropic API Key

### 1. Clone and Install

```bash
git clone <repository-url>
cd context-graph-ai
pnpm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-your-api-key
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
MONGODB_URI=mongodb://localhost:27017/context-ai
```

### 3. Start Services

```bash
# Start Neo4j and Redis
docker-compose up neo4j redis mongodb -d

# Run development server
pnpm dev
```

### 4. Access the Application

Open [http://localhost:3000](http://localhost:3000) and create an account.

## Seeding Data

After registering, seed your knowledge graph using the API:

```bash
# Login first to get session cookie, then:
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d @data/seed-developer.json \
  --cookie "session=<your-session-token>"
```

Sample seed files are provided in the `data/` directory:
- `seed-developer.json` - Software engineer profile
- `seed-researcher.json` - AI researcher profile

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Get current user |
| `/api/chat` | POST | Send message (streaming) |
| `/api/seed` | POST | Seed knowledge graph |
| `/api/context/:userId` | GET | Get user context |

## Docker Deployment

### Full Stack

```bash
docker-compose up -d
```

### Production Build

```bash
docker build -t context-ai .
docker run -p 3000:3000 --env-file .env context-ai
```

## Project Structure

```
├── app/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── api/              # API routes
│   ├── globals.css       # Tailwind CSS theme
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main chat page
├── components/
│   ├── chat/             # Chat components
│   ├── layout/           # Layout components
│   ├── providers/        # React providers
│   └── ui/               # UI primitives
├── lib/
│   ├── ai/               # Anthropic client
│   ├── auth/             # Session management
│   ├── db/               # Neo4j & Redis clients
│   ├── services/         # Business logic
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   └── validations/      # Zod schemas
├── data/                 # Sample seed data
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## License

MIT
