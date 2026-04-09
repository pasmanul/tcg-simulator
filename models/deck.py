import json
import os
import uuid
from typing import List

from .card import Card


class Deck:
    MAX_SIZE = 40

    def __init__(self, name: str = "新しいデッキ"):
        self.name = name
        self.back_image_path: str = ""
        self.cards: List[Card] = []

    @property
    def total_count(self) -> int:
        return sum(c.count for c in self.cards)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "back_image_path": self.back_image_path,
            "cards": [
                {
                    "id": c.id,
                    "name": c.name,
                    "image_path": c.image_path,
                    "count": c.count,
                    "mana": c.mana,
                    "civilizations": c.civilizations,
                    "card_type": c.card_type,
                }
                for c in self.cards
            ],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Deck":
        deck = cls(data["name"])
        deck.back_image_path = data.get("back_image_path", "")
        for c in data.get("cards", []):
            deck.cards.append(
                Card(
                    name=c["name"],
                    image_path=c["image_path"],
                    count=c.get("count", 1),
                    mana=c.get("mana", 0),
                    civilizations=c.get("civilizations", []),
                    card_type=c.get("card_type", ""),
                    id=c.get("id", str(uuid.uuid4())),
                )
            )
        return deck

    def save(self, path: str):
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)

    @classmethod
    def load(cls, path: str) -> "Deck":
        with open(path, "r", encoding="utf-8") as f:
            return cls.from_dict(json.load(f))
