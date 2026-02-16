from .metadata import ALLOWED_VALUES, format_allowed_values, has_valid_metadata 
from .utils import get_collection_and_filter, render_prompt
from .state import State, embedding_model, search_tool
from .llm_utils import call_llm
from langchain_core.messages import HumanMessage
import json
from langchain.vectorstores import Chroma


def meta_node(state: State) -> State:
    print("\n[Meta Node]")
    query = state["query"]
    allowed_str = format_allowed_values(ALLOWED_VALUES)
    schema_keys = ", ".join(["disaster_type", "doc_type", "agency", "language"])

    prompt = render_prompt(
        "meta_extractor",
        query=query,
        allowed_values=allowed_str,
        schema_keys=schema_keys,
    )
    raw = call_llm(prompt)
    try:
        meta = json.loads(raw)
    except Exception:
        print("Warning: LLM response not valid JSON, storing raw text")
        meta = {"raw": raw}

    state["metadata"] = meta
    state["has_valid_meta"] = has_valid_metadata(meta)
    print("Extracted metadata:", state["metadata"])
    print("Has valid meta?:", state["has_valid_meta"])
    return state


def filtered_retriever_node(state: State) -> State:
    print("\n[Filtered Retriever]")
    query = state["query"]
    meta = state.get("metadata") or {}
    disaster, filt = get_collection_and_filter(meta)
    persist_dir = f"./agentic_rag/chroma_db/{disaster}"

    # NEW: explicitly show which collection was selected
    print(f"Selected collection: '{disaster}'  |  Path: {persist_dir}")

    vectorstore = Chroma(
        collection_name=disaster,
        persist_directory=persist_dir,
        embedding_function=embedding_model
    )
    results = vectorstore.similarity_search(query, k=3, filter=filt if filt else None)

    state["retrieved_docs"] = [{"content": r.page_content, "metadata": r.metadata} for r in results]
    state["did_filtered"] = True
    print(f"Query: {query}")
    print(f"Filter used: {filt if filt else '{} (none)'}")
    print(f"Retrieved {len(results)} docs from '{disaster}' collection (filtered)")
    return state


def general_retriever_node(state: State) -> State:
    print("\n[General Retriever]")
    query = state["query"]

    meta = state.get("metadata") or {}
    disaster = meta.get("disaster_type")
    if disaster not in ALLOWED_VALUES["disaster_type"]:
        disaster = "flood"
    persist_dir = f"./agentic_rag/chroma_db/{disaster}"

    # NEW: explicitly show which collection was selected
    print(f"Selected collection: '{disaster}'  |  Path: {persist_dir}")

    vectorstore = Chroma(
        collection_name=disaster,
        persist_directory=persist_dir,
        embedding_function=embedding_model
    )
    results = vectorstore.similarity_search(query, k=3)

    state["retrieved_docs"] = [{"content": r.page_content, "metadata": r.metadata} for r in results]
    state["did_general"] = True
    print(f"Query: {query}")
    print(f"Retrieved {len(results)} docs from '{disaster}' collection (general)")
    return state


def assessor_node(state: State) -> State:
    print("\n[Assessor]")
    query = state["query"]
    docs = state.get("retrieved_docs", [])

    if not docs:
        print("No retrieved docs → setting sufficient=False")
        state["sufficient"] = False
        return state
   
    context = "\n".join([doc["content"] for doc in state.get("retrieved_docs", [])])
    prompt = render_prompt("assessor", query=query, context=context)
    response_text = call_llm([HumanMessage(content=prompt)]).upper()

    state["sufficient"] = "YES" in response_text
    print(f"Assessor decision: {state['sufficient']}")
    return state


def reformulator_node(state: State) -> State:
    print("\n[Reformulator]")
    query = state["query"]
    prompt = render_prompt("reformulator", query=query)
    new_query = call_llm([HumanMessage(content=prompt)])

    state["query"] = new_query
    state["reformulated"] = True
    print(f"Reformulated query: {new_query}")
    return state


def websearch_node(state: State) -> State:
    print("\n[Web Search]")
    query = state["query"]
    result = search_tool.run(query)
    if not state.get("retrieved_docs"):
        state["retrieved_docs"] = []
    state["retrieved_docs"].append({"content": result, "metadata": {"source": "tavily"}})
    print("Added web search result.")
    return state


def answer_node(state: State) -> State:
    print("\n[Answer]")
    query = state["query"]
    context = "\n".join([doc["content"] for doc in state.get("retrieved_docs", [])])
    prompt = render_prompt("answer", query=query, context=context)
    state["answer"] = call_llm([HumanMessage(content=prompt)])

    print("Generated final answer.")
    return state


def taskgen_node(state: State) -> State:
    print("\n[Task Generator]")
    query = state.get("query", "").strip()
    docs = state.get("retrieved_docs", [])

    if not docs:
        print("Error: No retrieved documents available for task generation.")
        state["tasks_yaml"] = None
        return state

    safe_contents = []
    for i, doc in enumerate(docs):
        content = doc.get("content", "")
        if not isinstance(content, str):
            print(f"[Debug] Non-string content at index {i}: type={type(content).__name__}")
            try:
                content = str(content)
            except Exception as e:
                print(f"[Warning] Failed to stringify content at index {i}: {e}")
                content = ""
        safe_contents.append(content)

    context = "\n".join(safe_contents).strip()
    if not context:
        print("Error: Retrieved documents contain no usable text content.")
        state["tasks_yaml"] = None
        return state

    prompt = render_prompt("task_generation", user_request=query, retrieved_kb=context)

    try:
        output = call_llm([HumanMessage(content=prompt)])
    except Exception as e:
        print(f"Error: Model invocation failed → {e}")
        state["tasks_yaml"] = None
        return state

    print("Raw LLM output (first 200 chars):", output[:200])

    if not output:
        print("Error: Empty model response.")
        state["tasks_yaml"] = None
    elif "tasks:" not in output.lower():
        print("Warning: Missing 'tasks:' key in model response.")
        state["tasks_yaml"] = None
    else:
        print("Generated YAML task plan successfully.")
        state["tasks_yaml"] = output

    return state


def meta_route(state: State) -> str:
    route = "filtered_retriever" if state.get("has_valid_meta") else "general_retriever"
    print(f"[Meta Route] has_valid_meta={state.get('has_valid_meta')} -> {route}")
    return route


def assessor_route(state: State) -> str:

    if not state.get("retrieved_docs"):
        if state.get("did_filtered") and not state.get("did_general"):
            print("[Assessor Route] No docs after filtered → general retriever")
            return "general_retriever"
        print("[Assessor Route] No docs after general → web search")
        return "websearch"
    
    if state["sufficient"]:
        return "taskgen_node"
    if not state.get("did_general"):
        return "general_retriever"
    if not state["reformulated"]:
        return "reformulator"
    return "websearch"
