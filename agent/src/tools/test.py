import httpx
from langchain_core.tools import tool
from dotenv import load_dotenv
import os

load_dotenv()

ESTIMATES_ENDPOINT = str(os.environ.get("ESTIMATES_ENDPOINT"))
TEST = f'{ESTIMATES_ENDPOINT}/hello'


@tool
def test() -> str:
    """Calls the estimates hello endpoint and returns the response."""
    result = httpx.get(TEST)
    return result.text


if __name__ == "__main__":
    print(test.invoke({}))
