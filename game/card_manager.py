
import json
from abc import ABC, abstractmethod

class CardProvider(ABC):
    @abstractmethod
    def get_market_cards(self):
        pass

    @abstractmethod
    def get_default_cards(self):
        pass

class JsonCardProvider(CardProvider):
    def __init__(self, config_path):
        with open(config_path) as f:
            self.card_data = json.load(f)

    def get_market_cards(self):
        return self.card_data.get('market_cards', {})

    def get_default_cards(self):
        return self.card_data.get('default_cards', {})

class CardManager:
    def __init__(self, provider: CardProvider):
        self.provider = provider
        self.market_cards = self.provider.get_market_cards()
        self.default_cards = self.provider.get_default_cards()

    def generate_market(self):
        import random
        market = {}
        for card_type, cards in self.market_cards.items():
            if isinstance(cards, list) and cards:  # カードリストが存在し空でない場合のみ
                market[card_type] = random.choice(cards)
        return market

    def get_default_cards(self):
        # 各種類のカードを1つずつ返す
        default_cards = {}
        for card_type, card in self.default_cards.items():
            if isinstance(card, dict):
                default_cards[card_type] = card
            elif isinstance(card, list) and card:
                default_cards[card_type] = card[0]
        return default_cards

    def get_default_card(self, card_type):
        cards = self.default_cards.get(card_type)
        if isinstance(cards, dict):
            return cards
        elif isinstance(cards, list) and cards:
            return cards[0]
        return None
