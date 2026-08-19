# Blog API — FastAPI + JWT Authentication

A REST API for a simple blogging platform, built with FastAPI. Supports user
registration, JWT-based login, and full CRUD on blog posts with pagination
and search.

This project was built as part of my self-study path toward becoming a
Full Stack AI Engineer, after completing SQL and moving into backend
development with FastAPI.

## What I built

The entire backend — every route, the database models, the JWT
authentication flow (registration, password hashing, token creation and
verification), and the CRUD logic — was designed and written by me.

I'm not a frontend developer. To see the API working end-to-end without
building the UI from scratch myself, I used AI assistance (Claude) to put
together the frontend (`static/` folder). It calls the same endpoints
documented below — nothing about the backend or the API design was
generated for me.

## Features

- User registration with hashed passwords (bcrypt via passlib)
- JWT-based login and route protection (`python-jose`)
- Create, read, update, and delete blog posts
- Pagination and title search on the blog listing
- SQLAlchemy ORM with a MySQL/Postgres-compatible connection string
- Pydantic schemas for request/response validation

## Tech stack

| Layer | Tech |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy |
| Auth | OAuth2PasswordBearer + JWT (python-jose) |
| Password hashing | passlib (bcrypt) |
| Validation | Pydantic |
| Server | Uvicorn |
| Frontend | Vanilla HTML/CSS/JS (AI-assisted) |

## API endpoints

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/register` | No | Create a new user account |
| POST | `/login` | No | Get a JWT access token |
| GET | `/` | No | API health message |
| GET | `/blogs` | No | List blogs (supports `page`, `limit`, `search`) |
| GET | `/blogs/{id}` | No | Get a single blog by id |
| POST | `/blogs` | Yes | Create a new blog post |
| PUT | `/blogs/{id}` | Yes | Update a blog post |
| DELETE | `/blogs/{id}` | Yes | Delete a blog post |
| GET | `/app` | No | Serves the frontend UI |

## Getting started

**1. Clone and set up a virtual environment**
```bash
git clone <your-repo-url>
cd Fastapi-project
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

**2. Create a `.env` file** in the project root:
```
db_url=mysql+pymysql://user:password@localhost/blog_db
Security_key=your-secret-key-here
```

**3. Run the server**
```bash
uvicorn main:app --reload
```

**4. Open the app**
- API docs (Swagger): `http://127.0.0.1:8000/docs`
- Frontend UI: `http://127.0.0.1:8000/app`

## Project structure

```
Fastapi-project/
├── main.py          # routes
├── models.py        # SQLAlchemy models
├── schemas.py        # Pydantic request/response schemas
├── database.py       # DB engine + session setup
├── oauth2.py          # JWT creation, verification, password hashing
├── static/            # frontend (AI-assisted)
│   ├── index.html
│   ├── style.css
│   └── app.js
└── requirements.txt
```

## What's next

- Ownership on blog posts (only the author can edit/delete their own)
- Refresh tokens
- Deployed live demo (Render)
- Tests with pytest

## Author

Ahmed — self-taught Software Engineering student, building toward
Full Stack AI Engineering. Connect with me on
[LinkedIn](www.linkedin.com/in/m-ahmed-hasan-170mr) · [GitHub](https://github.com/ahmadhasssan461-hub)
