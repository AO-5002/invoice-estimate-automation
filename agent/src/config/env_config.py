import os
from dotenv import load_dotenv

load_dotenv()

# Estimate Endpoints
ESTIMATE_ENDPOINT = os.getenv('ESTIMATES_ENDPOINT')
ESTIMATE_APPEND_ROW = f"{ESTIMATE_ENDPOINT}/append"

# Invoice Endpoints
INVOICE_ENDPOINT = os.getenv('ESTIMATES_ENDPOINT')
INVOICE_APPEND_ROW = f"{INVOICE_ENDPOINT}/append"
