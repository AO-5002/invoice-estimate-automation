from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.routes import improve


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load environment/config once before serving requests.
    from src.config import env_config  # noqa: F401

    yield
    # Shutdown: nothing to tear down yet.


app = FastAPI(title="Invoice Automation Agent", lifespan=lifespan)

app.include_router(improve.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001)
