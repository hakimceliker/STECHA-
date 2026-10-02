"""Anthropic AI Service - Real Claude AI Integration"""

from typing import Optional, Generator
from anthropic import Anthropic, APIError
import logging

logger = logging.getLogger(__name__)


class AnthropicService:
    """Service for interacting with Claude API"""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        """Initialize Anthropic client"""
        self.api_key = api_key
        self.model = model
        self.client = Anthropic(api_key=api_key)
        self.conversation_history = {}

    def chat(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> dict:
        """Send a message and get a response"""

        if conversation_id and conversation_id in self.conversation_history:
            messages = self.conversation_history[conversation_id]
        else:
            messages = []

        messages.append({"role": "user", "content": message})

        try:
            system = system_prompt or self._get_default_system_prompt()

            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=messages,
                temperature=temperature
            )

            assistant_message = response.content[0].text
            messages.append({"role": "assistant", "content": assistant_message})

            if conversation_id:
                self.conversation_history[conversation_id] = messages

            return {
                "response": assistant_message,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                },
                "model": self.model
            }
        except APIError as e:
            logger.error(f"Anthropic API error: {str(e)}")
            raise

    def generate_reservation_approval_score(
        self,
        business_name: str,
        guest_count: int,
        reservation_time: str,
        special_requests: str
    ) -> dict:
        """Generate AI-powered approval score for reservations"""

        prompt = f"""Analyze this restaurant reservation request and provide an approval score (0-100) based on:
- Business capacity match
- Time availability
- Special requests feasibility

Reservation Details:
- Restaurant: {business_name}
- Guest Count: {guest_count}
- Time: {reservation_time}
- Special Requests: {special_requests}

Respond ONLY with JSON: {{"score": <0-100>, "reason": "<brief explanation>", "recommendation": "approve|review|reject"}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )

            import json
            text = response.content[0].text
            result = json.loads(text)
            return result
        except Exception as e:
            logger.warning(f"Error generating approval score: {str(e)}")
            return {"score": 50, "reason": "AI evaluation unavailable", "recommendation": "review"}

    def generate_pre_order_summary(self, items: list[str]) -> str:
        """Generate summary for pre-order items"""

        items_text = "\n".join(f"- {item}" for item in items)
        prompt = f"""Summarize this food pre-order in one sentence (Turkish if original language):
{items_text}

Respond with ONLY the summary, no other text."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}]
            )

            return response.content[0].text.strip()
        except Exception as e:
            logger.warning(f"Error generating summary: {str(e)}")
            return "Pre-order items summary unavailable"

    def moderate_content(self, text: str) -> dict:
        """Moderate user-generated content for safety"""

        prompt = f"""Analyze this text for safety and appropriateness.

Text: {text}

Respond ONLY with JSON: {{"safe": true/false, "reason": "<explanation>", "severity": "none|low|medium|high"}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )

            import json
            return json.loads(response.content[0].text)
        except Exception as e:
            logger.warning(f"Error moderating content: {str(e)}")
            return {"safe": True, "reason": "Moderation unavailable", "severity": "none"}

    @staticmethod
    def _get_default_system_prompt() -> str:
        """Get default system prompt for Stech AI"""
        return """You are Stech AI, a helpful Turkish restaurant and pre-order assistant.
You help users with:
- Making and managing restaurant reservations
- Placing and tracking food pre-orders
- Finding nearby restaurants and cafes
- Providing restaurant information and recommendations
- Managing their user profile

Always respond in Turkish when the user speaks Turkish.
Be friendly, concise, and helpful.
For technical issues, guide users to customer support."""


class AnthropicStreamService:
    """Service for streaming responses from Claude API"""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        """Initialize Anthropic client for streaming"""
        self.api_key = api_key
        self.model = model
        self.client = Anthropic(api_key=api_key)

    def stream_chat(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> Generator[str, None, None]:
        """Stream a chat response"""

        system = system_prompt or AnthropicService._get_default_system_prompt()

        try:
            with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": message}],
                temperature=temperature
            ) as stream:
                for text in stream.text_stream:
                    yield text
        except APIError as e:
            logger.error(f"Anthropic API error: {str(e)}")
            yield f"Error: {str(e)}"
