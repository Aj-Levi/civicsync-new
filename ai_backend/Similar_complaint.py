import os
from google import genai
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
print(GEMINI_API_KEY)

class ComplaintAnalysis(BaseModel):
    is_duplicate: bool
    result: str 

client = genai.Client(api_key=GEMINI_API_KEY)

# 5. The API Call
def check_complaint(new_complaint, history):
    prompt = f"""
    You are a support assistant. Compare the 'New Complaint' against the 'Existing List'.
    If the 'New Complaint' is semantically the same as one in the list, return 'already there'.
    Otherwise, return 'not done'.
    
    Existing List: {history}
    New Complaint: {new_complaint}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": ComplaintAnalysis,
        }
    )
    
    return response.parsed

