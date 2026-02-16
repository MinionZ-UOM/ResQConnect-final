from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .api.deps import get_current_user

from .api.requests import router as requests_router
from .api.task import router as tasks_router
# from .api.resource import router as resources_router
from .api.workflow_outputs import router as workflow_outputs_router
from .api.workflow_tasks import router as workflow_tasks_router
from .api.workflow_resources import router as workflow_resources_router
from .api.auth import router as auth_router
from .api.disaster import router as disaster_router
from .api.chat import router as chat_router
from .api.observation import router as observation_router
# from .api.agent import router as agent_router
from .api.chatbot import router as chatbot_router


from app.schemas.user import User 

# import sys

# if sys.platform == "win32":
#     import asyncio
#     asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uncomment this ONLY when testing the backend Endpoints 

# if os.getenv("ENV", "development") == "development":
#     async def _fake_user() -> User:
#         return User(
#             uid="savinu",
#             email="dev@example.com",
#             role_id="affected_individual",        
#             display_name="savinu",
#             role=None,                
#         )

#     app.dependency_overrides[get_current_user] = _fake_user


app.include_router(requests_router)
app.include_router(tasks_router)
# app.include_router(resources_router)
app.include_router(workflow_outputs_router)
app.include_router(workflow_tasks_router)
app.include_router(workflow_resources_router)
app.include_router(auth_router)
app.include_router(disaster_router)
app.include_router(chat_router)
app.include_router(observation_router)
# app.include_router(agent_router)
app.include_router(chatbot_router)



@app.get("/", tags=["health"])
async def root():
    return {"status": "ok"}
