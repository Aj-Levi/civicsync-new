import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
import uvicorn
import datetime
from Quick_suggestions import get_quick_fix
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import List
from Similar_complaint import check_complaint

load_dotenv()

app = FastAPI()

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIVEKIT_API_KEY = "devkey"
LIVEKIT_API_SECRET = "12345678901234567890123456789012"

@app.get("/get-token")
def get_token(identity: str = "browser-user", room: str = "test-room"):
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(identity) \
        .with_ttl(datetime.timedelta(hours=12)) \
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room,
            can_publish=True,
            can_subscribe=True,
        )) \
        .to_jwt()
    
    print(token)

    return {"token": token}

class QueryRequest(BaseModel):
    query: str

@app.post("/get-fix")
def get_fix(request_data: QueryRequest):
    try:
        response = get_quick_fix(request_data.query)
        return response 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ComplaintRequest(BaseModel):
    prev_complaint: List[str]
    complaint: str

@app.post("/similar-complaint")
def similar_complaint(request_data: ComplaintRequest):
    try:
        response = check_complaint(request_data.complaint,request_data.prev_complaint)
        return response 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)