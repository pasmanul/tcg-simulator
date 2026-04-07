import uuid
from dataclasses import dataclass, field
from typing import List


@dataclass
class Card:
    name: str
    image_path: str
    count: int = 1
    mana: int = 0
    civilizations: List[str] = field(default_factory=list)
    card_type: str = ""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
