#!/bin/bash

# --- COLORS FOR NOTIFICATIONS ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting System Check...${NC}"

# --- STEP 1: CHECK NODE.JS INSTALLATION ---
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}[OK] Node.js is installed.$(node -v)${NC}"
else
    echo -e "${RED}[FAIL] Node.js is not installed. Please install it to continue.${NC}"
    exit 1
fi

# --- STEP 2: CHECK ESSENTIAL FILES ---
if [ -f ".env" ]; then
    echo -e "${GREEN}[OK] .env file found.${NC}"
else
    echo -e "${RED}[FAIL] .env file is missing!${NC}"
    echo "Please create it and add your TMDB_API_KEY."
    exit 1
fi

if [ -f "server.js" ]; then
    echo -e "${GREEN}[OK] server.js found.${NC}"
else
    echo -e "${RED}[FAIL] server.js is missing!${NC}"
    exit 1
fi

# --- STEP 3: CHECK & INSTALL DEPENDENCIES ---
if [ -d "node_modules" ]; then
    echo -e "${GREEN}[OK] Dependencies (node_modules) appear to be installed.${NC}"
else
    echo -e "${YELLOW}[INFO] node_modules not found. Installing dependencies...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] Dependencies installed successfully.${NC}"
    else
        echo -e "${RED}[FAIL] NPM Install failed.${NC}"
        exit 1
    fi
fi

# --- STEP 4: START THE SERVER ---
echo -e "${YELLOW}[INFO] Starting backend server on port 3000...${NC}"
# Run node in the background and silence standard output slightly so it doesn't clutter
node server.js > server.log 2>&1 &
SERVER_PID=$! # Save the Process ID so we can kill it later if needed

# --- STEP 5: VERIFY SERVER IS LISTENING (The "Integration Test") ---
echo -e "${YELLOW}[INFO] Waiting for server to come alive...${NC}"

# Loop to check if the server is responding (timeout after 10 seconds)
attempts=0
max_attempts=10
server_up=false

while [ $attempts -lt $max_attempts ]; do
    # Try to fetch the homepage. If connection works, server is up.
    if curl -s http://localhost:3000 > /dev/null; then
        server_up=true
        break
    fi
    sleep 1
    attempts=$((attempts+1))
done

if [ "$server_up" = true ]; then
    echo -e "${GREEN}[SUCCESS] Server is responding at http://localhost:3000${NC}"
else
    echo -e "${RED}[FAIL] Server failed to start within 10 seconds.${NC}"
    echo "Check 'server.log' for error details."
    kill $SERVER_PID # Clean up the failed process
    exit 1
fi

# --- STEP 6: LAUNCH BROWSER ---
echo -e "${GREEN}[ACTION] Opening your default browser...${NC}"
start http://localhost:3000

echo -e "${YELLOW}---------------------------------------------------${NC}"
echo -e "${YELLOW}App is running! Press CTRL+C in this window to stop.${NC}"
echo -e "${YELLOW}---------------------------------------------------${NC}"

# Keep script running to maintain the server process
wait $SERVER_PID