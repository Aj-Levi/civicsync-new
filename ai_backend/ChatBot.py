from vectore_store import vectorstore
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel
import json

class QueryAnswer(BaseModel):
    answer: str

def Query_answer(query: str):
    client = genai.Client()

    retrieved = vectorstore.similarity_search(query, k=3)
    context = "\n\n".join([doc.page_content for doc in retrieved])
    print("Context:", context)
    
    prompt = f"""
            You are 'Civic Sync Guide', a smart interface kiosk assistant. Your role is to help users understand and navigate our system.

            User Query: "{query}"
            Official Documentation Context: "{context}"

            Instructions for your response:
            1. Answer the user's query clearly and concisely based ONLY on the provided context.
            2. Format your answer using short bullet points. Do not use long paragraphs.
            3. Provide step-by-step instructions and include any relevant app usage links found in the context.
            4. If the context does not contain the answer, politely inform the user that you cannot assist with that specific request.
            5. Ensure the final output is properly escaped for a JSON string (use \\n for newlines).

            Output ONLY a valid JSON object in this exact format. Do not include markdown tags like ```json.
            {{"answer": "<Your formatted answer here>"}}
            """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QueryAnswer,
                temperature=1.0
            )
        )

        return json.loads(response.text)

    except Exception as e:
        print("Gemini Error:", str(e))
        return {"status": "error", "message": str(e)}
    