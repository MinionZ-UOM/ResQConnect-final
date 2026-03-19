import os
import sys
from celery import Celery, shared_task
from redis import ConnectionPool, Redis
from dotenv import load_dotenv

from app.crud.workflow_output import upsert as store_workflow_output
from app.utils.logger import get_logger
from app.utils.workflow_output_parser import build_workflow_output_payload
logger = get_logger(__name__)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
load_dotenv()


REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")

if CELERY_BROKER_URL:
    _pool = ConnectionPool.from_url(CELERY_BROKER_URL, max_connections=5)
    broker_url = CELERY_BROKER_URL
else:
    missing_vars = [name for name, value in {
        "REDIS_HOST": REDIS_HOST,
        "REDIS_PASSWORD": REDIS_PASSWORD,
    }.items() if not value]
    if missing_vars:
        raise EnvironmentError(
            "Missing required environment variable(s) for Celery/Redis: "
            + ", ".join(missing_vars)
        )

    _pool = ConnectionPool(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        max_connections=5,
    )
    broker_url = f"redis://{REDIS_USERNAME}:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"

shared_redis = Redis(connection_pool=_pool)

celery_app = Celery(
    'backend',
    broker=broker_url,
    backend=None,
)

celery_app.conf.update(
    result_expires=3600,
    timezone="UTC",
    broker_connection_timeout=30,
    task_time_limit=300,

    broker_pool_limit=5,           
    broker_transport_options={
        'max_connections': 5,
        'visibility_timeout': 3600,
    },

    # Worker concurrency & prefetch
    worker_concurrency=2,          
    worker_prefetch_multiplier=1,    

    task_acks_late=True,
    task_acks_on_failure_or_timeout=True,
    task_ignore_result=True,
)

from app.agent_v2.runner import run_workflow as run_agent_v2_workflow

@shared_task(bind=True, name='agent_flow', max_retries=3, default_retry_delay=10)
def run_agentic_workflow(self, agent_payload: dict):
    """
    This task runs the agentic workflow asynchronously.
    """
    try:
        request_text = agent_payload.get("request_text")
        if not request_text:
            raise ValueError("Missing request_text for agentic workflow")

        response = run_agent_v2_workflow(
            request_text=request_text,
            image_url=agent_payload.get("image_url"),
            image_b64=agent_payload.get("image_b64"),
            metadata=agent_payload.get("metadata"),
        )
        workflow_run_id = self.request.id

        rag_output = response.get("rag_output") or {}
        tasks_yaml = None
        if isinstance(rag_output, dict):
            tasks_yaml = rag_output.get("tasks_yaml")

        request_id = agent_payload.get("request_id")

        if tasks_yaml:
            if not request_id:
                logger.warning(
                    "Skipping workflow output persistence because request_id is missing",
                    extra={"workflow_id": workflow_run_id},
                )
            else:
                try:
                    payload = build_workflow_output_payload(
                        workflow_id=workflow_run_id,
                        request_id=request_id,
                        tasks_yaml=tasks_yaml,
                    )
                    store_workflow_output(payload)
                    logger.info(
                        "Stored workflow output",
                        extra={
                            "workflow_id": workflow_run_id,
                            "request_id": request_id,
                            "tasks_count": len(payload.tasks),
                            "resources_count": len(payload.resource_suggestions),
                        },
                    )
                except Exception:  # pragma: no cover - logging path
                    logger.exception(
                        "Failed to persist workflow output",
                        extra={
                            "workflow_id": workflow_run_id,
                            "request_id": request_id,
                        },
                    )
        logger.info(
            "Agentic workflow completed.",
            extra={
                "request_id": request_id,
                "metadata_keys": list((agent_payload.get("metadata") or {}).keys()),
            },
        )
        return response
    except Exception as e:
        logger.error(f"Agentic workflow failed: {e}")
        raise self.retry(exc=e)
