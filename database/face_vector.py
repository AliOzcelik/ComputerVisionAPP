import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, FilterSelector
import uuid

COLLECTION = "faces"
DIM = 512

class FaceVectorStore:
    def __init__(self):
        os.makedirs("./data/qdrant", exist_ok=True)
        self.client = QdrantClient(path="./data/qdrant")  # local persistent
        self._ensure_collection()

    def _ensure_collection(self):
        existing = [c.name for c in self.client.get_collections().collections]
        if COLLECTION not in existing:
            self.client.create_collection(
                COLLECTION,
                vectors_config=VectorParams(size=DIM, distance=Distance.COSINE)
            )

    def register(self, person_id: str, embedding: list[float]) -> str:
        point_id = str(uuid.uuid4())
        self.client.upsert(COLLECTION, points=[
            PointStruct(id=point_id, vector=embedding, payload={"person_id": person_id})
        ])
        return point_id

    def search(self, embedding: list[float], threshold: float = 0.5) -> dict | None:
        results = self.client.query_points(
            collection_name=COLLECTION,
            query=embedding,
            limit=1,
            with_payload=True
        ).points
        if results and results[0].score >= threshold:
            return {"person_id": results[0].payload["person_id"], "score": results[0].score}
        return None

    def delete_person(self, person_id: str):
        self.client.delete(
            collection_name=COLLECTION,
            points_selector=FilterSelector(
                filter=Filter(must=[FieldCondition(key="person_id", match=MatchValue(value=person_id))])
            )
        )

    def close(self):
        self.client.close()
