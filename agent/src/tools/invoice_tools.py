import httpx
from langchain_core.tools import tool
from schemas.InvoiceRecord import InvoiceRecord
from src.config.env_config import INVOICE_APPEND_ROW


@tool
def invoice_append_row(record: InvoiceRecord) -> str:
    """Append a new invoice to the invoice sheet."""
    try:
        result = httpx.post(
            INVOICE_APPEND_ROW,
            json=record.model_dump(by_alias=True),
            timeout=10.0,
        )
        result.raise_for_status()
    except httpx.TimeoutException:
        return "Failed: the invoice service did not respond in time. Try again shortly."
    except httpx.HTTPStatusError as e:
        return f"Failed: server returned {e.response.status_code}. {e.response.text}"
    except httpx.RequestError as e:
        return f"Failed: could not reach the invoice service ({e})."

    return "Successfully appended the invoice to the invoice sheet."
