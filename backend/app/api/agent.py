# from fastapi import APIRouter, Depends
# from app.agent.schemas.state import State
# from app.agent.core.manager import Manager


# router = APIRouter(prefix="/agent", tags=["agent"])

# @router.post("/ask", response_model=State)
# async def ask(
#     body: State
# ):  
    
#     manager = Manager()

#     response = manager.run(body)
    
#     return response    

# # @router.post("/visualize", response_model=str)
# # async def ask():  
    
# #     manager = Manager()

# #     path = manager.visualize()
    
# #     return path   