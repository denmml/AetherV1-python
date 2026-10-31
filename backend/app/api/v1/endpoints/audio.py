"""audio.py — Whisper API transcription endpoint.

POST /api/v1/audio/transcribe
  - Accepts an audio file upload (multipart/form-data)
  - Saves the file to UPLOAD_DIR
  - Sends it to OpenAI Whisper API for transcription
  - Persists a Lecture record (with transcript) to the database
  - Returns lecture_id + transcript text
"""

import os
import uuid
import logging
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.lecture import Lecture
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audio", tags=["Audio / Whisper"])

# ---------------------------------------------------------------------------
# Allowed audio MIME types accepted by OpenAI Whisper
# ---------------------------------------------------------------------------
ALLOWED_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/flac",
    "video/mp4",       # some browsers send mp4 for recorded blobs
    "video/webm",
    "application/octet-stream",  # fallback — browser MediaRecorder sometimes sends this
}

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB — Whisper API hard limit


# ---------------------------------------------------------------------------
# Helper: call OpenAI Whisper API
# ---------------------------------------------------------------------------
async def _transcribe_with_whisper(file_path: Path, filename: str) -> str:
    """
    Send *file_path* to OpenAI Whisper API (/v1/audio/transcriptions)
    and return the transcribed text.

    Raises HTTPException on any API-level or network error.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API key is not configured on the server.",
        )

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            with open(file_path, "rb") as audio_bytes:
                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    files={"file": (filename, audio_bytes, "application/octet-stream")},
                    data={"model": "whisper-1", "response_format": "text"},
                )

        if response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Invalid OpenAI API key.",
            )
        if response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OpenAI rate limit exceeded. Please try again later.",
            )
        if response.status_code != 200:
            logger.error(
                "Whisper API returned %s: %s", response.status_code, response.text
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Whisper API error ({response.status_code}): {response.text[:300]}",
            )

        return response.text.strip()

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="OpenAI Whisper API timed out. The audio file may be too long.",
        )
    except httpx.RequestError as exc:
        logger.exception("Network error contacting Whisper API")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Network error contacting Whisper API: {exc}",
        )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.post(
    "/transcribe",
    summary="Transcribe an audio file via OpenAI Whisper",
    status_code=status.HTTP_201_CREATED,
)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file (mp3/wav/webm/ogg/flac, ≤ 25 MB)"),
    title: str = Form(default="", description="Optional lecture title"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an audio file, transcribe it with OpenAI Whisper, and persist the
    result as a **Lecture** record linked to the authenticated user.

    Returns:
        ```json
        {
          "lecture_id": 42,
          "title": "My Recording",
          "transcript": "...",
          "status": "transcribed"
        }
        ```
    """
    # ------------------------------------------------------------------
    # 1. Validate MIME type
    # ------------------------------------------------------------------
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type: '{file.content_type}'. "
                "Accepted: mp3, wav, webm, ogg, flac, mp4."
            ),
        )

    # ------------------------------------------------------------------
    # 2. Read file content & check size
    # ------------------------------------------------------------------
    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file exceeds the 25 MB limit imposed by OpenAI Whisper API.",
        )
    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # ------------------------------------------------------------------
    # 3. Persist audio file to UPLOAD_DIR
    # ------------------------------------------------------------------
    upload_dir: Path = settings.UPLOAD_DIR / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    original_ext = Path(file.filename or "audio.webm").suffix or ".webm"
    unique_filename = f"{uuid.uuid4().hex}{original_ext}"
    save_path = upload_dir / unique_filename

    try:
        save_path.write_bytes(audio_bytes)
    except OSError as exc:
        logger.exception("Failed to save uploaded audio to %s", save_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save audio file: {exc}",
        )

    # ------------------------------------------------------------------
    # 4. Create a "pending" Lecture record immediately (so the DB row
    #    exists even if Whisper later fails)
    # ------------------------------------------------------------------
    lecture_title = title.strip() or (file.filename or "Untitled Recording")
    lecture = Lecture(
        title=lecture_title,
        audio_file_path=str(save_path),
        status="processing",
        user_id=current_user.id,
    )
    db.add(lecture)
    await db.commit()
    await db.refresh(lecture)

    # ------------------------------------------------------------------
    # 5. Transcribe via Whisper API
    # ------------------------------------------------------------------
    try:
        transcript_text = await _transcribe_with_whisper(save_path, unique_filename)
    except HTTPException:
        # Mark the record as failed so the UI can reflect the error state
        lecture.status = "failed"
        await db.commit()
        raise  # Re-raise the original HTTP exception to the client

    # ------------------------------------------------------------------
    # 6. Update Lecture record with the transcription result
    # ------------------------------------------------------------------
    lecture.transcript = transcript_text
    lecture.status = "transcribed"
    await db.commit()
    await db.refresh(lecture)

    return {
        "lecture_id": lecture.id,
        "title": lecture.title,
        "transcript": lecture.transcript,
        "status": lecture.status,
        "user_id": current_user.id,
    }


# ---------------------------------------------------------------------------
# List all lectures for the current user
# ---------------------------------------------------------------------------
@router.get(
    "/lectures",
    summary="List all lecture transcriptions for the current user",
)
async def list_lectures(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all Lecture records belonging to the authenticated user."""
    from sqlalchemy import select

    result = await db.execute(
        select(Lecture)
        .where(Lecture.user_id == current_user.id)
        .order_by(Lecture.created_at.desc())
    )
    lectures = result.scalars().all()

    return [
        {
            "lecture_id": lec.id,
            "title": lec.title,
            "status": lec.status,
            "transcript": lec.transcript,
            "created_at": lec.created_at.isoformat() if lec.created_at else None,
        }
        for lec in lectures
    ]


# ---------------------------------------------------------------------------
# Get a single lecture by ID
# ---------------------------------------------------------------------------
@router.get(
    "/lectures/{lecture_id}",
    summary="Get a single lecture transcription",
)
async def get_lecture(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a specific Lecture record. Users can only access their own lectures."""
    lecture = await db.get(Lecture, lecture_id)

    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Lecture not found.")
    if lecture.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Access denied.")

    return {
        "lecture_id": lecture.id,
        "title": lecture.title,
        "status": lecture.status,
        "transcript": lecture.transcript,
        "audio_file_path": lecture.audio_file_path,
        "created_at": lecture.created_at.isoformat() if lecture.created_at else None,
        "user_id": lecture.user_id,
    }


# ---------------------------------------------------------------------------
# Delete a lecture
# ---------------------------------------------------------------------------
@router.delete(
    "/lectures/{lecture_id}",
    summary="Delete a lecture and its audio file",
    status_code=status.HTTP_200_OK,
)
async def delete_lecture(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a Lecture record and remove the stored audio file from disk."""
    lecture = await db.get(Lecture, lecture_id)

    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Lecture not found.")
    if lecture.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Access denied.")

    # Try to remove the audio file (best-effort; don't fail the request if missing)
    audio_path = Path(lecture.audio_file_path)
    if audio_path.exists():
        try:
            audio_path.unlink()
        except OSError:
            logger.warning("Could not delete audio file: %s", audio_path)

    await db.delete(lecture)
    await db.commit()

    return {"status": "deleted", "lecture_id": lecture_id}
