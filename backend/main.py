import os
import httpx
import json
import random
import re
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from threading import Lock
from zoneinfo import ZoneInfo

load_dotenv()
nasa_api_key = os.getenv("NASA_API_KEY")
gemini_api_key = os.getenv("GEMINI_API_KEY")

gemini_client = genai.Client(
    api_key=gemini_api_key
)

facts_file_path = os.path.join(
    os.path.dirname(__file__),
    "data",
    "space_facts.json"
)

with open(facts_file_path, "r", encoding="utf-8") as file:
    space_facts = json.load(file)

class ChatMessage(BaseModel):
    role: str
    text: str = Field(
        min_length=1,
        max_length=3000
    )

class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1, 
        max_length=500
    )
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=30
    )


PACIFIC_TIME = ZoneInfo("America/Los_Angeles")

CHAT_DAILY_LIMIT = 20

chat_quota_date = datetime.now(PACIFIC_TIME).date()

chat_request_count = 0

chat_quota_lock = Lock()

def check_chat_quota():

    global chat_quota_date
    global chat_request_count

    current_date = datetime.now(PACIFIC_TIME).date()

    with chat_quota_lock:

        if current_date != chat_quota_date:

            chat_quota_date = current_date
            chat_request_count = 0

        if chat_request_count >= CHAT_DAILY_LIMIT:

            raise HTTPException(
                status_code=429,
                detail="Cosmos has reached today's chat limit."
            )

        chat_request_count += 1

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://zemyna-sl.github.io"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {
        "message": "Cosmos backend is working!"
    }


@app.get("/api/nasa-image")
def get_nasa_image():

    for attempt in range(10):

        start_date = datetime(1995, 6, 16).date()
        today = datetime.now(PACIFIC_TIME).date()

        random_date = start_date + timedelta(
            days=random.randint(0, (today - start_date).days)
        )

        nasa_date = random_date.strftime("%y%m%d")

        response = httpx.get(
            f"https://science.nasa.gov/wp-json/wp/v2/apod-basic/{nasa_date}"
            )

        if response.status_code != 200:
            continue

        data = response.json()

        if data["media_type"] == "image" and data.get("hdurl"):

            explanation = re.sub(r"<[^>]+>", "", data["explanation"])

            return {
                "title": data["title"],
                "explanation": explanation,
                "image_url": data["hdurl"],
                "date": data["date"],
                "media_type": data["media_type"]
            }

    return {
        "error": "Could not find an image after several attempts."
    }

@app.get("/api/random-fact")
def get_random_fact():
    return random.choice(space_facts)

@app.post("/api/chat")
def chat(request: ChatRequest):

    contents = []

    for message in request.history:

        contents.append(
            types.Content(
                role=message.role,
                parts=[
                    types.Part(
                        text=message.text
                    )
                ]
            )
        )

    contents.append(
        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=request.message
                )

            ]
        )
    )

    check_chat_quota()

    response = gemini_client.models.generate_content(
        model="gemini-3.6-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            max_output_tokens=3000,
            system_instruction=(
                "You are Cosmos Buddy, a friendly and curious space companion. "
                "Answer questions about space, astronomy, planets, stars, galaxies, "
                "space exploration, spacecraft, and related science. "
                "Keep responses clear, warm, and reasonably concise. "
                "Answer in about 2 to 4 short sentences by default unless the question needs more detail. "
                "Use plain text only and do not use Markdown formatting such as asterisks, headings, or bullet points. "
                "Avoid unnecessary greetings, filler, or overly flowery language. "
                "Base factual answers on established scientific knowledge. "
                "Do not invent sources, citations, or scientific facts. "
                "If something is uncertain, theoretical, disputed, or not confirmed, "
                "make that clear in your answer. "
                "You may respond naturally to brief social messages such as greetings, thanks, "
                "farewells, questions about your name, or simple questions about how you are. "
                "These are the only non-space topics you should answer directly. "
                "Before answering any other request, determine whether it is meaningfully related to "
                "space, astronomy, astrophysics, planets, stars, galaxies, spacecraft, space exploration, "
                "or closely related science. "
                "If a request is not related to those topics, do not answer the question itself. "
                "Instead, briefly explain that you are Cosmos Buddy and can only help with space-related topics, "
                "then invite the user to ask something about space. "
                "This rule applies even if the unrelated question is simple, factual, harmless, or easy to answer."
            )
        )
    )

    return {
        "reply": response.text
    }