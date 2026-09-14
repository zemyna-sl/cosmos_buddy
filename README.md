# Cosmos Buddy

An interactive space-themed web application built with JavaScript and FastAPI, combining an AI space companion with NASA imagery and curated space facts.

The project brings together frontend development, backend API design, external API integration, request validation, conversational context, and lightweight usage safeguards in a single application.

## Project Overview

Cosmos Buddy is designed as a small interactive space companion rather than a general-purpose chatbot.

The application includes three main features:

- **Cosmos AI** — a space-focused conversational assistant powered by the Gemini API
- **NASA Image** — retrieves random astronomy imagery and accompanying information through NASA's API
- **Random Space Fact** — displays curated NASA-sourced facts from a local JSON dataset

The frontend is built with HTML, CSS, and JavaScript, while a Python FastAPI backend handles external API requests, chat validation, conversation context, and API-key protection.

## Features

### Cosmos AI

Cosmos answers questions about topics such as:

- astronomy
- planets and moons
- stars and galaxies
- spacecraft
- space exploration
- related scientific concepts

The assistant is instructed to keep answers clear and reasonably concise, distinguish uncertain or theoretical information where appropriate, and restrict substantive answers to space-related topics while still allowing brief social conversation.

Conversation history is maintained for the current page session and is cleared when the page is refreshed.

### NASA Image

The NASA image feature requests Astronomy Picture of the Day data through the NASA API.

Because the NASA endpoint can also return non-image media, the backend retries the request until an image result is found or the retry limit is reached.

### Random Space Fact

Space facts are loaded from a curated local JSON dataset.

Each entry contains:

- the fact
- its source
- a source URL

The current dataset uses NASA material as its source.

## Tech Stack

- **Python** — backend application logic
- **FastAPI** — API routes and middleware
- **Pydantic** — request validation
- **Google Gemini API** — Cosmos AI responses
- **NASA API** — astronomy imagery and metadata
- **HTML** — application structure
- **CSS** — interface design and animation
- **JavaScript** — frontend interactions, API requests, and session conversation history
- **Uvicorn** — ASGI server for the FastAPI backend

## API Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Check whether the backend is running |
| `/api/nasa-image` | GET | Retrieve a NASA astronomy image |
| `/api/random-fact` | GET | Retrieve a random curated space fact |
| `/api/chat` | POST | Send a message and conversation context to Cosmos |

## Chat Safeguards

The chat endpoint includes several lightweight safeguards intended for a public portfolio application.

- new user messages are limited to **500 characters**
- individual conversation-history entries are limited to **3,000 characters**
- a maximum of **30 previous messages** can be included as conversation context
- Gemini generation is capped at **3,000 output tokens**
- the application allows a maximum of **20 chat requests per Pacific quota day**

The application-level daily counter is stored in memory and therefore resets if the backend process restarts. Gemini's own API quota remains the external quota limit.

API keys are stored in a local `.env` file and are not exposed to the frontend.

## Project Structure

```text
cosmos_buddy/
├── backend/
│   ├── data/
│   │   └── space_facts.json
│   └── main.py
├── index.html
├── script.js
├── styles.css
├── requirements.txt
├── README.md
└── .gitignore
```

- **`backend/main.py`** — FastAPI backend, external API requests, validation, and chat safeguards
- **`backend/data/space_facts.json`** — curated space-fact dataset
- **`index.html`** — application structure
- **`script.js`** — frontend interactions and API communication
- **`styles.css`** — application styling and animations
- **`requirements.txt`** — pinned Python dependencies
- **`.gitignore`** — excludes environment files, virtual environments, caches, and local development files


## Notes & Limitations

- conversation history exists only for the current page session
- the application-level daily chat counter is stored in backend memory and resets when the backend process restarts
- Gemini availability remains subject to the API provider's own quota and rate limits
- NASA image availability depends on successful responses from the external NASA API
- the interface is designed for desktop use and is not optimized for mobile devices

---

This project was prepared as a portfolio project demonstrating **frontend development, Python backend development with FastAPI, API integration, request validation, conversational AI, state handling, and practical API safeguards**.