import os
from fastapi import FastAPI, HTTPException, File,UploadFile,Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from livekit import api
import uvicorn
import datetime
from Quick_suggestions import get_quick_fix
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import List
from Similar_complaint import check_complaint
from ChatBot import Query_answer
from Ai_image_Validator import process_complaint
import shutil
import tempfile

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://civicsync-new.vercel.app", 
        "http://localhost:5173" # Good to keep for local testing!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

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
    
class Question(BaseModel):
    que: str

@app.post("/get-answer")
def get_answer(request_data: Question):
    response = Query_answer(request_data.que)
    return response

@app.post("/verify_complaint")
async def verify_complaint(
    complaint_text: str = Form(...),
    image: UploadFile = File(...)
):
    _, ext = os.path.splitext(image.filename)
    
    if not ext:
        ext = ".jpg"

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        shutil.copyfileobj(image.file, temp_file)
        temp_path = temp_file.name
        
    try:
        result = process_complaint(temp_path, complaint_text)
        return JSONResponse(content=result)
        
    finally:
        image.file.close() 
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)




