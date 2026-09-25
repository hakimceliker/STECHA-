"""AI geçidi — kapsam dokümanının §Teknik mimari bölümündeki
"sağlayıcıdan bağımsız katman" burada uygulanır. Tüm AI çağrıları bu
modülden geçer ki maliyet kaydı ve model değişimi tek yerden yönetilsin.

Bu iskelette gerçek bir sağlayıcıya bağlanmaz (API anahtarı yoksa çalışır);
üretimde `_call_provider` içi gerçek istemciyle (ör. OpenAI/Anthropic SDK)
değiştirilir.
"""

from dataclasses import dataclass

from app.core.config import settings


@dataclass
class AIResponse:
    content: str
    model: str
    tokens_in: int
    tokens_out: int
    cost_usd: float


def _estimate_cost(tokens_in: int, tokens_out: int, model: str) -> float:
    # Yaklaşık birim fiyat (kapsam dokümanı §6 — gerçek fiyatla değiştirilecek).
    rate_in, rate_out = (0.000003, 0.000015) if model == settings.AI_MODEL_ADVANCED else (0.0000005, 0.0000015)
    return round(tokens_in * rate_in + tokens_out * rate_out, 6)


def chat_completion(user_message: str, use_advanced: bool = False) -> AIResponse:
    """Tek bir sohbet cevabı üretir. Gerçek sağlayıcı yoksa açıklayıcı bir
    yanıt döner, böylece backend anahtar olmadan da test edilebilir."""

    model = settings.AI_MODEL_ADVANCED if use_advanced else settings.AI_MODEL_FAST

    if not settings.AI_PROVIDER_API_KEY:
        content = (
            "(Demo yanıt — AI_PROVIDER_API_KEY tanımlı değil) "
            f"Mesajınızı aldım: \"{user_message[:120]}\""
        )
    else:
        # TODO: gerçek sağlayıcı çağrısı burada yapılır.
        content = "(Sağlayıcı entegrasyonu tamamlanınca burada gerçek yanıt olacak.)"

    tokens_in = max(1, len(user_message) // 4)
    tokens_out = max(1, len(content) // 4)
    cost = _estimate_cost(tokens_in, tokens_out, model)

    return AIResponse(content=content, model=model, tokens_in=tokens_in, tokens_out=tokens_out, cost_usd=cost)
