from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import cv2
import numpy as np
import uuid
from src.face_recognition import FaceEngine
from database.face_vector import FaceVectorStore
from database.face_sqlite import register_person, log_recognition, get_person, get_all_persons, delete_person

router = APIRouter(prefix="/face", tags=["face"])
engine = FaceEngine()
vector_store = FaceVectorStore()


def decode_image(file: bytes) -> np.ndarray:
    arr = np.frombuffer(file, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


@router.get("/persons")
def persons():
    return get_all_persons()


@router.delete("/{person_id}")
def remove(person_id: str):
    person = get_person(person_id)
    if person is None:
        raise HTTPException(404, "Person not found")
    vector_store.delete_person(person_id)
    delete_person(person_id)
    return {"deleted": person_id}


@router.post("/register")
async def register(name: str, image: UploadFile = File(...)):
    """name: str, image: UploadFile = File(...)"""
    
    image = await image.read()
    image = decode_image(image)
    embedding = engine.get_embedding(image)
    if embedding is None:
        raise HTTPException(400, "No face detected")
    
    person_id = str(uuid.uuid4())
    register_person(person_id=person_id, name=name)
    vector_store.register(person_id=person_id, embedding=embedding)
    return {"person_id": person_id, "name": name}
    
    
@router.post("/recognize")
async def recognize(image: UploadFile = File(...), threshold: float = 0.5):
    """Recognize a face in the image against the registered gallery."""
    
    image = await image.read()
    image = decode_image(image)
    detected_faces = engine.get_face_embeddings(image)
    if not detected_faces:
        raise HTTPException(400, "No face detected")

    faces = []
    best_match = None
    best_confidence = None
    for detected in detected_faces:
        result = vector_store.search(embedding=detected["embedding"].tolist(), threshold=threshold)
        if result is None:
            faces.append({
                "box": detected["box"],
                "match": None,
                "label": "Unknown",
                "confidence": None,
            })
            continue

        person = get_person(result["person_id"])
        log_recognition(result["person_id"], result["score"])
        faces.append({
            "box": detected["box"],
            "match": person,
            "label": person["name"] if person else "Unknown",
            "confidence": result["score"],
        })
        if person and (best_confidence is None or result["score"] > best_confidence):
            best_match = person
            best_confidence = result["score"]

    if best_match is None:
        return {"match": None, "faces": faces, "message": "Unknown person"}

    return {"match": best_match, "confidence": best_confidence, "faces": faces}
