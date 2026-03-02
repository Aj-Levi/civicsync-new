#!/bin/bash

# 1. Start agent in the background with forced logs
PYTHONUNBUFFERED=1 python voice_agent.py start &

# 2. Wait 5 seconds to prevent the 98% CPU spike
sleep 5

# 3. Start FastAPI server in the foreground
uvicorn server:app --host 0.0.0.0 --port $PORT
