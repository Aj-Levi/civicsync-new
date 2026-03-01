import requests
import json
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel
import json
import PIL.Image

load_dotenv()

SIGHT_ENGINE_API_KEY=os.getenv("SIGHT_ENGINE_API_KEY")
SIGHT_ENGINE_API_USER=os.getenv("SIGHT_ENGINE_API_USER")

class ComplaintStatus(BaseModel):
    status: str

def Ai_image_detect(image_path):
    url = 'https://api.sightengine.com/1.0/check.json'

    params = {
        'models': 'genai',
        'api_user': SIGHT_ENGINE_API_USER,
        'api_secret': SIGHT_ENGINE_API_KEY
    }
    
    try:
        with open(image_path, 'rb') as f:
            files = {'media': f}
            response = requests.post(url, files=files, data=params)

        result = response.json()

        if result.get("status") == "success":
            ai_score = result.get("type", {}).get("ai_generated", 0)

            if ai_score > 0.60:
                return {
                    "status": "ai_generated",
                    "ai_score": ai_score
                }
            else:
                return {
                    "status": "real",
                    "ai_score": ai_score
                }
        else:
            return {
                "status": "api_error",
                "message": result.get("error", {}).get("message", "Unknown error")
            }

    except Exception as e:
        return {
            "status": "system_error",
            "message": str(e)
        }

def Verify_Complaint(image_path, complaint_text):
    client = genai.Client()

    try:
        img = PIL.Image.open(image_path)
    except Exception as e:
        return {"status": "error", "message": str(e)}

    prompt = f"""
        You are an AI complaint verification agent. 
        Analyze the attached image against the user's complaint text: "{complaint_text}".
        
        Determine the status based on these exact rules:
        1. If the image clearly shows the issue (e.g., broken road shown as broken): return "true complaint"
        2. If the complaint cannot be visually proven or disproven by a photo (e.g., streetlight not working, bad smell, power outage): return "unambiguous complaint"
        3. If the image clearly contradicts the complaint (e.g., complains about a broken road but shows a perfectly smooth road): return "fake complaint"
        
        Output ONLY a valid JSON object in this format: {{"status": "<your_status_choice>"}}
        Do not include markdown tags like ```json.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, img],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ComplaintStatus,
                temperature=0.0
            )
        )

        return json.loads(response.text)

    except Exception as e:
        print("Gemini Error:", str(e))
        return {"status": "error", "message": str(e)}

def process_complaint(image_path, complaint_text):

    ai_result = Ai_image_detect(image_path)

    if ai_result["status"] == "ai_generated":
        return {
            "status": "Ai_Generated",
            "ai_score": ai_result["ai_score"]
        }

    if ai_result["status"] in ["api_error", "system_error"]:
        return {
            "status": "error",
            "reason": ai_result.get("message")
        }

    gemini_result = Verify_Complaint(image_path, complaint_text)

    return {
        "status": gemini_result.get("status")
    }
