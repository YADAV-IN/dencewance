#!/bin/bash
# Terminal 1: Backend
echo "Starting Backend..."
cd /workspaces/alok-website/server
fuser -k 4000/tcp || true
npm run dev &
BACKEND_PID=$!

# Terminal 2: Frontend
echo "Starting Frontend..."
cd /workspaces/alok-website
fuser -k 3000/tcp || true
echo "VITE_API_URL=http://localhost:4000" > .env
npx vite --port 3000 --host &
FRONTEND_PID=$!

wait
