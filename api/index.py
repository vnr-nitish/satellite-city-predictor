"""
Vercel entrypoint.

Vercel's Python builder expects a serverless function file under /api that
exposes an ASGI/WSGI `app`. The actual application code lives in backend/ so
it stays a single source of truth for both local development (`uvicorn
main:app`, run from backend/) and this deployment - this file just makes
that directory importable and re-exports the FastAPI app.

backend/ is bundled into this function via vercel.json's `includeFiles`
config; without that, Vercel would only see this one file.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from main import app  # noqa: E402 (import must follow the sys.path change above)
