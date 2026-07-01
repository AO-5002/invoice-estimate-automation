from langchain_anthropic import ChatAnthropic

anthropic_llm = ChatAnthropic(
    model_name="claude-sonnet-4-6",
    timeout=None,
    stop=None,
)
