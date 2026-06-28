from .estimate_tools import estimate_append_row
from .invoice_tools import invoice_append_row

INVOICE_TOOLS = [invoice_append_row]
ESTIMATE_TOOLS = [estimate_append_row]
ALL_TOOLS = [*INVOICE_TOOLS, *ESTIMATE_TOOLS]
