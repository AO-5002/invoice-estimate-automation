import httpx
from langchain_core.tools import tool
from schemas.EstimateRecord import EstimateRecord
from src.config.env_config import ESTIMATE_APPEND_ROW


@tool
def estimate_append_row(record: EstimateRecord) -> str:
    """Append a new estimate to the estimates sheet."""
    try:
        result = httpx.post(
            ESTIMATE_APPEND_ROW,
            json=record.model_dump(by_alias=True),
            timeout=10.0,
        )
        result.raise_for_status()
    except httpx.TimeoutException:
        return "Failed: the estimates service did not respond in time. Try again shortly."
    except httpx.HTTPStatusError as e:
        return f"Failed: server returned {e.response.status_code}. {e.response.text}"
    except httpx.RequestError as e:
        return f"Failed: could not reach the estimates service ({e})."

    return "Successfully appended the estimate to the estimates sheet."
