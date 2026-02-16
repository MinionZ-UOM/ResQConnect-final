"""Standard (non-agentic) RAG workflow utilities.

This module mirrors the data-access patterns used by the agentic workflow:
the same helper functions are reused for loading knowledge base files and
building a persisted collection that the chatbot and other consumers can
depend on.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from threading import Lock
from time import perf_counter
from typing import Any, Dict, List, Optional, Tuple

from langchain_community.vectorstores import Chroma

from app.utils.logger import get_logger

from .llm_utils import call_llm
from .state import embedding_model
from .utils import load_data_from_json, render_prompt

logger = get_logger(__name__)


KB_DIR_DEFAULT = Path(__file__).parent / "knowledgebase"
PERSIST_ROOT_DEFAULT = Path(__file__).parent / "chroma_db"

KB_FILES: Dict[str, str] = {
    "flood": "flood.json",
    "landslide": "landslides.json",
}

COLLECTION_NAME = "standard"

_kb_lock = Lock()
_vectorstore_lock = Lock()
_kb_ready: Dict[Tuple[str, str], bool] = {}
_vectorstore_cache: Dict[str, Chroma] = {}


def _ensure_collection(kb_dir: Path, persist_root: Path) -> None:
    """Create or update the persisted Chroma collection from all knowledge base files."""

    persist_dir = persist_root / COLLECTION_NAME
    persist_dir.mkdir(parents=True, exist_ok=True)

    vectorstore = Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(persist_dir),
        embedding_function=embedding_model,
    )

    try:
        existing = vectorstore._collection.count()
    except Exception:  # pragma: no cover - defensive; depends on chroma backend
        existing = 0

    if existing:
        logger.info(
            "[%s] Reusing existing collection with %d vectors (kb_dir=%s, persist=%s)",
            COLLECTION_NAME,
            existing,
            kb_dir,
            persist_dir,
        )
        return

    start_time = perf_counter()
    logger.info(
        "[%s] Building collection from knowledge base files (kb_dir=%s, persist=%s)",
        COLLECTION_NAME,
        kb_dir,
        persist_dir,
    )
    texts: List[str] = []
    metadatas: List[Dict[str, Any]] = []

    for collection, filename in KB_FILES.items():
        kb_file = kb_dir / filename
        if not kb_file.exists():
            logger.warning("[%s] Knowledge base file missing: %s", collection, kb_file)
            continue

        docs, meta = load_data_from_json(str(kb_file))
        if not docs:
            logger.warning("[%s] No documents found in %s", collection, kb_file)
            continue

        if not meta or len(meta) != len(docs):
            logger.warning("[%s] Metadata missing/misaligned — fixing.", collection)
            meta = [{} for _ in docs]

        clean_meta: List[Dict[str, Any]] = []
        for item in meta:
            if not isinstance(item, dict):
                item = {}
            cleaned = {key: (value if value is not None else "Null") for key, value in item.items()}
            clean_meta.append(cleaned)

        texts.extend(str(doc) for doc in docs)
        metadatas.extend(clean_meta)

    if not texts:
        logger.warning("No knowledge base documents available under %s", kb_dir)
        return

    if metadatas and len(metadatas) == len(texts):
        vectorstore.add_texts(texts=texts, metadatas=metadatas)
    else:
        vectorstore.add_texts(texts=texts)
    vectorstore.persist()
    elapsed = perf_counter() - start_time
    logger.info(
        "[%s] Ingested %d documents in %.2fs",
        COLLECTION_NAME,
        len(texts),
        elapsed,
    )


def ensure_knowledge_bases(
    kb_dir: Path = KB_DIR_DEFAULT,
    persist_root: Path = PERSIST_ROOT_DEFAULT,
) -> None:
    """Ensure all supported knowledge bases are ingested exactly once per path pair."""

    cache_key = (str(kb_dir.resolve()), str(persist_root.resolve()))
    if _kb_ready.get(cache_key):
        logger.debug(
            "[%s] Knowledge bases already ensured for kb_dir=%s persist_root=%s",
            COLLECTION_NAME,
            kb_dir,
            persist_root,
        )
        return

    with _kb_lock:
        if _kb_ready.get(cache_key):
            logger.debug(
                "[%s] Knowledge bases already ensured inside lock for kb_dir=%s persist_root=%s",
                COLLECTION_NAME,
                kb_dir,
                persist_root,
            )
            return

        start_time = perf_counter()
        logger.debug(
            "[%s] Ensuring knowledge bases (kb_dir=%s, persist_root=%s)",
            COLLECTION_NAME,
            kb_dir,
            persist_root,
        )
        _ensure_collection(kb_dir, persist_root)

        logger.debug(
            "[%s] Knowledge bases ensured in %.2fs",
            COLLECTION_NAME,
            perf_counter() - start_time,
        )
        _kb_ready[cache_key] = True


def _get_vectorstore(persist_dir: Path) -> Chroma:
    """Return a cached Chroma instance for the combined standard collection."""

    cache_key = str(persist_dir.resolve())
    cached = _vectorstore_cache.get(cache_key)
    if cached is not None:
        logger.debug(
            "[%s] Reusing cached vector store instance (persist=%s)",
            COLLECTION_NAME,
            persist_dir,
        )
        return cached

    with _vectorstore_lock:
        cached = _vectorstore_cache.get(cache_key)
        if cached is not None:
            logger.debug(
                "[%s] Reusing cached vector store instance after lock (persist=%s)",
                COLLECTION_NAME,
                persist_dir,
            )
            return cached

        instance = Chroma(
            collection_name=COLLECTION_NAME,
            persist_directory=str(persist_dir),
            embedding_function=embedding_model,
        )
        logger.info(
            "[%s] Created new vector store instance (persist=%s)",
            COLLECTION_NAME,
            persist_dir,
        )
        _vectorstore_cache[cache_key] = instance
        return instance


def retrieve(
    query: str,
    k: int = 3,
    *,
    kb_dir: Path = KB_DIR_DEFAULT,
    persist_root: Path = PERSIST_ROOT_DEFAULT,
) -> List[Dict[str, Any]]:
    """Retrieve relevant documents from the knowledge base."""

    ensure_knowledge_bases(kb_dir, persist_root)

    persist_dir = persist_root / COLLECTION_NAME

    vectorstore = _get_vectorstore(persist_dir)

    retrieval_start = perf_counter()
    results = vectorstore.similarity_search(query, k=k)
    retrieval_elapsed = perf_counter() - retrieval_start

    logger.info(
        "[%s] Retrieved %d documents for query in %.2fs (k=%d)",
        COLLECTION_NAME,
        len(results),
        retrieval_elapsed,
        k,
    )

    return [
        {"content": match.page_content}
        for match in results
    ]


def build_answer(
    query: str,
    documents: List[Dict[str, Any]],
) -> str:
    """Generate an answer from retrieved documents using the shared prompt helpers."""

    context = "\n".join(str(doc.get("content", "")) for doc in documents)
    prompt = render_prompt("answer", query=query, context=context)
    return call_llm(prompt)


def initialize_retrieval_system(knowledgebase_dir: Optional[str] = None) -> bool:
    """Backwards-compatible helper used by the chatbot layer."""

    kb_dir = Path(knowledgebase_dir) if knowledgebase_dir else KB_DIR_DEFAULT
    logger.debug(
        "[%s] Initialising retrieval system (kb_dir=%s, persist_root=%s)",
        COLLECTION_NAME,
        kb_dir,
        PERSIST_ROOT_DEFAULT,
    )
    try:
        ensure_knowledge_bases(kb_dir=kb_dir, persist_root=PERSIST_ROOT_DEFAULT)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Failed to initialise standard retrieval system: %s", exc)
        return False
    logger.debug(
        "[%s] Retrieval system initialised successfully", COLLECTION_NAME
    )
    return True


def run_workflow(
    query: str,
    *,
    k: int = 3,
    kb_dir: Path = KB_DIR_DEFAULT,
    persist_root: Path = PERSIST_ROOT_DEFAULT,
) -> Dict[str, Any]:
    """Full standard RAG workflow: retrieve documents and craft an answer."""

    workflow_start = perf_counter()
    logger.debug(
        "[%s] Running standard workflow (k=%d)",
        COLLECTION_NAME,
        k,
    )
    documents = retrieve(
        query=query,
        k=k,
        kb_dir=kb_dir,
        persist_root=persist_root,
    )

    answer = build_answer(query, documents) if documents else ""
    logger.info(
        "[%s] Workflow completed in %.2fs (documents=%d, answer_length=%d)",
        COLLECTION_NAME,
        perf_counter() - workflow_start,
        len(documents),
        len(answer),
    )

    return {
        "query": query,
        "documents": documents,
        "answer": answer,
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the standard RAG workflow")
    parser.add_argument("query", help="User question to answer")
    parser.add_argument("--k", type=int, default=3, help="Number of documents to retrieve")
    parser.add_argument(
        "--kb_dir",
        type=str,
        default=str(KB_DIR_DEFAULT),
        help="Directory containing knowledge base JSON files",
    )
    parser.add_argument(
        "--persist_root",
        type=str,
        default=str(PERSIST_ROOT_DEFAULT),
        help="Directory where Chroma collections are stored",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    kb_dir = Path(args.kb_dir)
    persist_root = Path(args.persist_root)

    logger.info("Running standard RAG workflow")
    result = run_workflow(
        query=args.query,
        k=args.k,
        kb_dir=kb_dir,
        persist_root=persist_root,
    )

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

