from google import genai
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

class SupportAdvice(BaseModel):
    quick_fix_instructions: List[str] # Step-by-step immediate actions
    safety_warning: str # Crucial "do not" advice

client = genai.Client(api_key=GEMINI_API_KEY)

def get_quick_fix(user_query: str):
    prompt = f"""
    Act as an emergency maintenance dispatcher. 
    Analyze the user's complaint and provide immediate safety and fix instructions.
    
    User Complaint: "{user_query}"
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": SupportAdvice,
        }
    )
    return response.parsed
