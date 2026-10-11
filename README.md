# Recipe Platform

A full-stack recipe sharing platform with an Angular front end and a Flask back end, featuring user authentication, recipe management, ingredient-based discovery, and an AI chef assistant powered by Google Gemini.

The user interface is Hebrew-first and uses an RTL layout.

## Tech stack

- Front end: Angular 19, TypeScript, RxJS, HTML/CSS, Tailwind CSS
- Back end: Python, Flask 3.1, Flask-SQLAlchemy, SQLite
- Authentication: JWT in HTTP-only cookies
- AI: Google Gemini via `google.generativeai`
- Image processing: Pillow
- Environment loading: `python-dotenv`

## Features

### Authentication and user roles

- User registration and login
- JWT-based authentication stored in an HTTP-only cookie
- Role handling for `Reader`, `Uploader`, and `Admin`
- Upload permission requests for approved recipe contributors
- Admin-only approval and rejection of uploader requests

### Recipe management

- Create, list, and fetch recipe records
- Recipe categories and dietary types (`Dairy`, `Meat`, `Parve`)
- Ingredients stored per recipe
- Average rating calculation
- Recipe deletion by admin

### Ingredient-based search

- Search recipes using a list of ingredients
- Match score based on shared ingredients
- Filter by recipe type and category

### Ratings

- User rating per recipe
- Ratings are stored in the database and included in average rating calculations

### Image handling

- Recipe image upload and storage under per-user folders in `uploads/`
- Original image plus generated artistic variations: grayscale, vibrant, vintage
- Image serving route for the Angular front end
- Recipe image cleanup when a recipe is deleted

### AI chef

- Free-form AI chat tied to a recipe context
- AI recipe adaptation modes:
  - `vegan`
  - `gluten_free`
  - `lactose_free`
  - `half`
  - `double`

## Architecture

The Angular application calls the Flask API over HTTP. The Flask app loads configuration from `config.py`, initializes SQLAlchemy, creates the SQLite database and runtime directories, and exposes REST endpoints for authentication, recipes, uploads, admin operations, and AI features. The Gemini API is called only from the Flask server, not directly from the browser.

```text
Angular app (localhost:4200)
        |
        v
Flask API (localhost:5000)
        |
        +--> SQLite database: instance/recipes.db
        |
        +--> uploads/ folders for user images
        |
        +--> Google Gemini AI API
```

## API overview

| Method | Path | Purpose | Auth | Admin |
| --- | --- | --- | --- | --- |
| POST | `/api/users` | Register a new user | No | No |
| POST | `/api/login` | Login and create JWT cookie | No | No |
| POST | `/api/logout` | Clear JWT cookie | No | No |
| GET | `/api/me` | Get current logged-in user | Yes | No |
| GET | `/api/user/<id>` | Get user profile | No | No |
| GET | `/api/user/<id>/recipes` | Get recipes by user | No | No |
| POST | `/api/user/request-upload-permission` | Request uploader approval | Yes | No |
| GET | `/api/admin/pending-users` | List pending uploader requests | Yes | Yes |
| POST | `/api/admin/approve-user/<id>` | Approve uploader | Yes | Yes |
| POST | `/api/admin/reject-user/<id>` | Reject uploader | Yes | Yes |
| GET | `/api/recipes` | List all recipes | No | No |
| GET | `/api/recipes/<id>` | Get one recipe | No | No |
| POST | `/api/recipes` | Create a recipe | Yes | No |
| DELETE | `/api/recipes/<id>` | Delete a recipe | Yes | Yes |
| POST | `/api/recipes/search-by-ingredients` | Search by ingredient list | No | No |
| POST | `/api/recipes/<id>/rate` | Rate a recipe | Yes | No |
| GET | `/api/recipes/<id>/user-rating` | Get current user rating | Yes | No |
| GET | `/api/images/<user_id>/<filename>` | Serve an image file | No | No |
| POST | `/api/ai/chat` | Chat with the AI chef | No | No |
| POST | `/api/ai/adapt` | Adapt a recipe to a target variation | No | No |

## Project structure

```text
.
├── Angular/
│   ├── src/
│   ├── package.json
│   ├── angular.json
│   └── README.md
├── Python/
│   ├── .gitignore
│   ├── .env.example
│   ├── app.py
│   ├── cacert.pem
│   ├── config.py
│   ├── requirements.txt
│   ├── seed.py
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── uploads/
│       └── user images, empty in the repository
├── README.md
```

## Getting started

### Prerequisites

- Python 3.x with a virtual environment
- Node.js and npm
- Access to a Google Gemini API key

### Back end setup

1. Open a terminal in the `Python` directory.
2. Create and activate a virtual environment.
3. Install dependencies:

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and fill in the values.
5. Start the Flask server:

```bash
python app.py
```

The back end runs on http://localhost:5000.

### Front end setup

1. Open a terminal in the `Angular` directory.
2. Install dependencies:

```bash
npm install
```

3. Start the Angular app:

```bash
npm start
# or
ng serve
```

The front end runs on http://localhost:4200.

### Environment variables

The application reads these environment variables:

- `SECRET_KEY`: JWT signing key
- `GEMINI_API_KEY`: Google Gemini API key
- `GEMINI_MODEL`: Gemini model name; default is `gemini-2.0-flash`

The app also sets `SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE`, and `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH` in `Python/app.py` for a local certificate workaround.

### Database creation

The database is SQLite and the connection string is defined in `Python/config.py` as:

```python
sqlite:////.../instance/recipes.db
```

When the Flask app starts, `create_app()` calls `db.create_all()` inside an application context. The `instance/` directory is created automatically by `Config.init_app(app)`.

### Admin setup

Use the seed script to create the default demo admin account and sample content:

```bash
python seed.py
```

### Sample data

The seed script creates:

- one admin user: username `admin`, password `Admin123!Demo`
- one approved uploader user
- six sample recipes across the supported categories and types (`Dairy`, `Meat`, `Parve`)
- ingredient rows and a few ratings from the sample users

This is intended for development and demos only.

## Security notes

- Passwords are hashed with Werkzeug before storage.
- JWTs are stored in an HTTP-only cookie named `auth_token`.
- The cookie is sent with `withCredentials: true` from the Angular app.
- API routes use `@token_required` and `@admin_required` decorators to enforce authentication and admin access.
- CORS is configured to allow `http://localhost:4200` only.
- The cookie is set with `secure=False` in development, which matches the local HTTP setup.
- The project includes a fallback development secret key in `Python/config.py` if `SECRET_KEY` is missing.
- AI endpoints are unauthenticated in this demo; add authentication or rate limiting before public deployment.

<!-- Screenshot: add a file at docs/screenshot.png -->

## Author

Chana Kosowsky, Full-Stack & AI Developer
https://github.com/chana-kosowsky
