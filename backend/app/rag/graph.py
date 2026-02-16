from langgraph.graph import StateGraph, END
from .state import State
from .nodes import (
    meta_node,
    filtered_retriever_node,
    general_retriever_node,
    assessor_node,
    reformulator_node,
    websearch_node,
    taskgen_node,
    meta_route,
    assessor_route,
)

graph = StateGraph(State)

# Add nodes
graph.add_node("meta", meta_node)
graph.add_node("filtered_retriever", filtered_retriever_node)
graph.add_node("general_retriever", general_retriever_node)
graph.add_node("assessor", assessor_node)
graph.add_node("reformulator", reformulator_node)
graph.add_node("websearch", websearch_node)
graph.add_node("taskgen_node", taskgen_node)  

# Entry point
graph.set_entry_point("meta")

# Conditional routes
graph.add_conditional_edges(
    "meta",
    meta_route,
    {
        "filtered_retriever": "filtered_retriever",
        "general_retriever": "general_retriever",
    },
)

graph.add_edge("filtered_retriever", "assessor")
graph.add_edge("general_retriever", "assessor")

graph.add_conditional_edges(
    "assessor",
    assessor_route,
    {
        "taskgen_node": "taskgen_node",       
        "general_retriever": "general_retriever",
        "reformulator": "reformulator",
        "websearch": "websearch",
    },
)

graph.add_edge("reformulator", "general_retriever")
graph.add_edge("websearch", "taskgen_node")   
graph.add_edge("taskgen_node", END)

# Compile
app = graph.compile()
