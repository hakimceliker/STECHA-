"""AI Gateway - Provider-agnostic interface for AI services"""

import os
from typing import Optional
from enum import Enum


class AIProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"


class AIModel(str, Enum):
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_35_TURBO = "gpt-3.5-turbo"
    CLAUDE_3_OPUS = "claude-3-opus-20240229"
    CLAUDE_3_SONNET = "claude-3-sonnet-20240229"
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307"


class AIGateway:
    """Unified interface for AI providers"""

    def __init__(self, provider: AIProvider = AIProvider.OPENAI, model: AIModel = AIModel.GPT_35_TURBO):
        self.provider = provider
        self.model = model
        self._init_provider()

    def _init_provider(self):
        """Initialize the selected provider with credentials"""
        if self.provider == AIProvider.OPENAI:
            self.api_key = os.getenv("OPENAI_API_KEY")
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY not set")
            try:
                import openai
                self.client = openai.OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed")

        elif self.provider == AIProvider.ANTHROPIC:
            self.api_key = os.getenv("ANTHROPIC_API_KEY")
            if not self.api_key:
                raise ValueError("ANTHROPIC_API_KEY not set")
            try:
                import anthropic
                self.client = anthropic.Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("anthropic package not installed")

        elif self.provider == AIProvider.COHERE:
            self.api_key = os.getenv("COHERE_API_KEY")
            if not self.api_key:
                raise ValueError("COHERE_API_KEY not set")
            try:
                import cohere
                self.client = cohere.Client(api_key=self.api_key)
            except ImportError:
                raise ImportError("cohere package not installed")

    def chat(self, messages: list[dict], system_prompt: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 1000) -> str:
        """Send a chat request to the AI provider"""
        try:
            if self.provider == AIProvider.OPENAI:
                return self._openai_chat(messages, system_prompt, temperature, max_tokens)
            elif self.provider == AIProvider.ANTHROPIC:
                return self._anthropic_chat(messages, system_prompt, temperature, max_tokens)
            elif self.provider == AIProvider.COHERE:
                return self._cohere_chat(messages, system_prompt, temperature, max_tokens)
        except Exception as e:
            raise ValueError(f"Error calling {self.provider.value} API: {str(e)}")

    def _openai_chat(self, messages: list[dict], system_prompt: Optional[str], temperature: float, max_tokens: int) -> str:
        """OpenAI chat completion"""
        if system_prompt:
            messages = [{"role": "system", "content": system_prompt}] + messages

        response = self.client.chat.completions.create(
            model=self.model.value,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content

    def _anthropic_chat(self, messages: list[dict], system_prompt: Optional[str], temperature: float, max_tokens: int) -> str:
        """Anthropic chat completion"""
        response = self.client.messages.create(
            model=self.model.value,
            max_tokens=max_tokens,
            system=system_prompt or "",
            messages=messages,
            temperature=temperature,
        )
        return response.content[0].text

    def _cohere_chat(self, messages: list[dict], system_prompt: Optional[str], temperature: float, max_tokens: int) -> str:
        """Cohere chat completion"""
        message_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        if system_prompt:
            message_text = f"System: {system_prompt}\n\n{message_text}"

        response = self.client.chat(
            message=message_text,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.text

    def embeddings(self, text: str) -> list[float]:
        """Generate embeddings for text"""
        try:
            if self.provider == AIProvider.OPENAI:
                return self._openai_embeddings(text)
            elif self.provider == AIProvider.ANTHROPIC:
                raise NotImplementedError("Anthropic does not provide embeddings API")
            elif self.provider == AIProvider.COHERE:
                return self._cohere_embeddings(text)
        except Exception as e:
            raise ValueError(f"Error generating embeddings: {str(e)}")

    def _openai_embeddings(self, text: str) -> list[float]:
        """OpenAI embeddings"""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    def _cohere_embeddings(self, text: str) -> list[float]:
        """Cohere embeddings"""
        response = self.client.embed(
            texts=[text],
            model="embed-english-v3.0",
            input_type="search_document"
        )
        return response.embeddings[0]
