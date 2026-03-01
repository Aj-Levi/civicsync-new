import os
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli, ChatContext, ChatMessage
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import sarvam
from livekit.plugins.google import llm as google_llm
import logging
from vectore_store import vectorstore

load_dotenv()

logger = logging.getLogger("rag-voice-agent")
logger.setLevel(logging.INFO)

class RAGVoiceAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
                You are a strict document-based assistant.
                You can ONLY answer questions using information 
                that will be provided in the conversation as context.

                STRICT RULES:
                - Never use general knowledge
                - Only use explicitly injected document context
                - If context is missing or insufficient, clearly say so
            """,

            stt=sarvam.STT(
                language="unknown",
                model="saaras:v3",
                mode="transcribe"
            ),

            llm=google_llm.LLM(model="gemini-2.5-flash"),

            tts=sarvam.TTS(
                target_language_code="en-IN",
                model="bulbul:v3",
                speaker="rohan"
            ),
        )

    # ✅ CORRECT RAG HOOK
    async def on_user_turn_completed(
        self,
        turn_ctx: ChatContext,
        new_message: ChatMessage,
    ) -> None:

        user_text = new_message.text_content
        print("User:", user_text)

        # 🔍 Perform similarity search
        retrieved = vectorstore.similarity_search(user_text, k=3)

        context = "\n\n".join([doc.page_content for doc in retrieved])
        print("Context:", context)

        # 🧠 Inject retrieved context BEFORE LLM runs
        if context.strip():
            turn_ctx.add_message(
                role="assistant",
                content=f"""
                    The following information is retrieved from the document:

                    ---------------------
                    {context}
                    ---------------------

                    You must ONLY use this information to answer the user's next question.
                    If the answer is not present in the above content, respond:
                    "The document does not contain information about this."
                    """
            )
            print("------>>>>>>>Correct condition")
        else:
            turn_ctx.add_message(
                role="assistant",
                content="""
No relevant information was found in the document.
If the user asks something unrelated, respond:
"I don't have information about that in the provided document."
"""
            )

            print("---->>>>Incorrect condition")


async def entrypoint(ctx: JobContext):
    print(f"User connected to room: {ctx.room.name}")

    session = AgentSession()

    await session.start(
        agent=RAGVoiceAgent(),
        room=ctx.room
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))