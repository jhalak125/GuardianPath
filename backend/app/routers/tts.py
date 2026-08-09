import io
from fastapi import APIRouter, Query, HTTPException, Response
from gtts import gTTS

router = APIRouter(prefix="/tts", tags=["Voice Audio Synthesis"])

AUDIO_CACHE = {}

@router.get("/speech")
async def get_speech_audio(
    text: str,
    lang: str = "hi"
):
    """
    Returns authentic, studio-quality native Hindi spoken MP3 audio.
    Cached for instantaneous streaming.
    """
    clean_lang = "hi" if not lang or not isinstance(lang, str) else lang.strip()
    clean_text = str(text).strip()
    
    cache_key = f"{clean_lang}_{clean_text}"
    if cache_key in AUDIO_CACHE:
        return Response(content=AUDIO_CACHE[cache_key], media_type="audio/mpeg")

    try:
        tts = gTTS(text=clean_text, lang=clean_lang, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        audio_bytes = fp.getvalue()
        
        AUDIO_CACHE[cache_key] = audio_bytes
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")
