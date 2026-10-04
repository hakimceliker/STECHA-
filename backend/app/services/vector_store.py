"""Vector Store Service - Store and retrieve embeddings for RAG"""

from typing import Optional
import json


class VectorStore:
    """In-memory vector store for embeddings (can be extended to use Pinecone, Weaviate, etc.)"""

    def __init__(self):
        self.vectors: dict[int, dict] = {}
        self.next_id = 1

    def add(self, text: str, embedding: list[float], metadata: Optional[dict] = None) -> int:
        """Add an embedding to the store"""
        doc_id = self.next_id
        self.vectors[doc_id] = {
            "text": text,
            "embedding": embedding,
            "metadata": metadata or {},
        }
        self.next_id += 1
        return doc_id

    def search(self, embedding: list[float], top_k: int = 5, threshold: float = 0.5) -> list[dict]:
        """Search for similar embeddings"""
        if not self.vectors:
            return []

        similarities = []
        for doc_id, data in self.vectors.items():
            similarity = self._cosine_similarity(embedding, data["embedding"])
            if similarity >= threshold:
                similarities.append({
                    "doc_id": doc_id,
                    "text": data["text"],
                    "metadata": data["metadata"],
                    "similarity": similarity
                })

        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities[:top_k]

    @staticmethod
    def _cosine_similarity(v1: list[float], v2: list[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if len(v1) != len(v2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude_v1 = sum(a ** 2 for a in v1) ** 0.5
        magnitude_v2 = sum(b ** 2 for b in v2) ** 0.5

        if magnitude_v1 == 0 or magnitude_v2 == 0:
            return 0.0

        return dot_product / (magnitude_v1 * magnitude_v2)

    def delete(self, doc_id: int) -> bool:
        """Delete an embedding from the store"""
        if doc_id in self.vectors:
            del self.vectors[doc_id]
            return True
        return False

    def clear(self):
        """Clear all embeddings"""
        self.vectors.clear()
        self.next_id = 1

    def get_stats(self) -> dict:
        """Get statistics about the vector store"""
        return {
            "total_vectors": len(self.vectors),
            "vector_dimension": len(self.vectors[next(iter(self.vectors))]["embedding"]) if self.vectors else 0
        }


# Global vector store instance
_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get or create the global vector store instance"""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
