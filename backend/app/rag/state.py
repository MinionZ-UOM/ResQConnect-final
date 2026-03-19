from typing import TypedDict, List, Dict, Any, Optional
from .utils import create_search_tool
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.tools.tavily_search import TavilySearchResults
from .providers.openai_provider import OpenAIProvider

class State(TypedDict):
    query: str
    history: List[str]
    retrieved_docs: Optional[List[Dict[str, Any]]]
    sufficient: bool
    reformulated: bool
    metadata: Optional[Dict[str, str]]
    has_valid_meta: bool        
    did_filtered: bool
    did_general: bool
    tasks_yaml: Optional[str]


# llm = ChatGroq(
#     model="llama-3.3-70b-versatile",
#     temperature=0,
#     groq_api_key=os.getenv("GROQ_API_KEY")
# )

Provider = "OPEN_AI"

llm = OpenAIProvider(temperature=0, model_name="gpt-4o-mini")

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

search_tool = create_search_tool()
