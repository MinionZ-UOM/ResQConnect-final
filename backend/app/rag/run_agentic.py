import argparse
import json
import logging
from pathlib import Path
from threading import Lock
from typing import Dict, Any, Optional

from .graph import app
from .state import State, embedding_model
from .utils import load_data_from_json
from langchain_community.vectorstores import Chroma 
from app.utils.logger import get_logger

logger = get_logger()

KB_DIR_DEFAULT = Path(__file__).parent / "knowledgebase"
PERSIST_ROOT_DEFAULT = Path(__file__).parent / "chroma_db"

KB_FILES = {
    "flood": "flood.json",
    "landslide": "landslides.json",
}
_kb_lock = Lock()
_kb_cache: Dict[tuple[str, str], bool] = {}


def _ensure_vector_collection(
    collection_name: str,
    kb_file: Path,
    persist_root: Path
) -> None:
    """
    Ensure a Chroma collection exists with vectors for the given knowledgebase file.
    - If DB is missing or empty, force ingestion.
    - Otherwise, reuse existing DB.
    """
    persist_dir = persist_root / collection_name
    persist_dir.mkdir(parents=True, exist_ok=True)

    vs = Chroma(
        collection_name=collection_name,
        persist_directory=str(persist_dir),
        embedding_function=embedding_model,
    )

    try:
        existing_count = vs._collection.count()
    except Exception:
        logger.warning(f"[{collection_name}] Could not count existing docs, forcing re-ingest.")
        existing_count = 0

    if existing_count == 0:
        if not kb_file.exists():
            raise FileNotFoundError(f"[{collection_name}] Knowledgebase file not found: {kb_file}")

        logger.info(f"[{collection_name}] Ingesting from {kb_file} → {persist_dir}")
        docs, metadatas = load_data_from_json(str(kb_file))

        if not docs:
            logger.error(f"[{collection_name}] No docs found in {kb_file}, ingestion skipped.")
            return

        # --- Fix metadata issues ---
        if not metadatas or len(metadatas) != len(docs):
            logger.warning(f"[{collection_name}] Metadata missing/misaligned — fixing.")
            metadatas = [{} for _ in docs]

        # Clean None values → "Null"
        clean_metas = []
        for m in metadatas:
            if not isinstance(m, dict):
                m = {}
            fixed = {k: (v if v is not None else "Null") for k, v in m.items()}
            clean_metas.append(fixed)
        metadatas = clean_metas

        # --- Ingest ---
        vs.add_texts(texts=[str(d) for d in docs], metadatas=metadatas)
        vs.persist()

        logger.info(f"[{collection_name}] Ingested {len(docs)} chunks with metadata.")
        logger.debug(f"[{collection_name}] Sample metadata: {metadatas[0]}")
    else:
        logger.info(f"[{collection_name}] Already has {existing_count} vectors — reusing DB.")

def ensure_knowledge_bases(
    kb_dir: Path = KB_DIR_DEFAULT,
    persist_root: Path = PERSIST_ROOT_DEFAULT
) -> None:
    """Create persistent vector DBs for all supported collections if needed."""
    cache_key = (str(kb_dir.resolve()), str(persist_root.resolve()))

    if _kb_cache.get(cache_key):
        return

    with _kb_lock:
        if _kb_cache.get(cache_key):
            return

        for collection, filename in KB_FILES.items():
            kb_path = kb_dir / filename
            _ensure_vector_collection(collection, kb_path, persist_root)

        _kb_cache[cache_key] = True

def build_initial_state(query: str,
                        metadata: Optional[Dict[str, str]] = None) -> State:
    return {
        "query": query,
        "history": [],
        "retrieved_docs": None,
        "sufficient": False,
        "reformulated": False,
        "metadata": metadata,
        "has_valid_meta": False,
        "did_filtered": False,
        "did_general": False,
        "tasks_yaml": None,
    }

def run_workflow(query: str,
                 metadata: Optional[Dict[str, str]] = None,
                 kb_dir: Path = KB_DIR_DEFAULT,
                 persist_root: Path = PERSIST_ROOT_DEFAULT) -> Dict[str, Any]:
    """
    End-to-end execution:
    1) Ensure persistent vector stores exist (auto-ingest if empty).
    2) Invoke the compiled LangGraph app with a fresh State.
    3) Return the final graph state.
    """
    ensure_knowledge_bases(kb_dir, persist_root)
    init_state = build_initial_state(query=query, metadata=metadata)
    final_state = app.invoke(init_state)
    return final_state

def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run the Agentic RAG workflow (persistent Chroma).")
    p.add_argument("query", type=str, help="User query/question")
    p.add_argument("--metadata", type=str, default=None,
                   help="Optional JSON string with metadata (e.g. '{\"disaster_type\":\"flood\",\"doc_type\":\"SOP\"}')")
    p.add_argument("--kb_dir", type=str, default=str(KB_DIR_DEFAULT), help="Path to knowledgebase directory")
    p.add_argument("--persist_root", type=str, default=str(PERSIST_ROOT_DEFAULT), help="Root dir for Chroma persistence")
    return p.parse_args()

def main():
    args = _parse_args()

    # Parse metadata JSON if provided
    meta: Optional[Dict[str, str]] = None
    if args.metadata:
        try:
            meta = json.loads(args.metadata)
            if not isinstance(meta, dict):
                raise ValueError("--metadata must be a JSON object")
        except Exception as e:
            logger.error(f"Invalid --metadata JSON: {e}")
            raise SystemExit(1)

    kb_dir = Path(args.kb_dir)
    persist_root = Path(args.persist_root)

    logger.info("Starting Agentic RAG workflow...")
    result = run_workflow(
        query=args.query,
        metadata=meta,
        kb_dir=kb_dir,
        persist_root=persist_root,
    )

    logger.info("Workflow complete.")
    print(result)
    tasks_output = result.get("tasks_yaml")
    print(type(tasks_output))
    if tasks_output:
        print("\n===== TASK PLAN =====\n")
        print(tasks_output)
    else:
        print("\n No tasks generated — likely insufficient retrieved KB or empty context.")
if __name__ == "__main__":
    main()

