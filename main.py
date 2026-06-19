from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database.face_sqlite import init_db
from database.caption_sqlite import init_db as init_caption_db
from routers import face, detection, segment, haardcascade, pose, caption
import uvicorn


app = FastAPI(title="Argus Vision Studio API")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
init_caption_db()
app.include_router(face.router)
app.include_router(detection.router)
app.include_router(segment.router)
app.include_router(haardcascade.router)
app.include_router(pose.router)
app.include_router(caption.router)

@app.on_event("shutdown")
def close_resources():
    face.vector_store.close()


@app.get("/")
def serve_frontend():
    return FileResponse("frontend/Computer Vision App.html")


# Serve frontend static files (must be last to not override API routes)
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
