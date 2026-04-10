カードライブラリ（data/cards.json）に新しいカードを追加する手順を案内してください。

1. data/cards/ にカード画像を配置する方法
2. data/cards.json の "cards" 配列に追記する JSON 形式の説明
   - id: uuid
   - name, image_path, mana, civilizations, card_type
   - 文明は models/card_library.py の CIVILIZATIONS リストから
   - カードタイプは CARD_TYPES リストから

または、アプリ内の「デッキ管理」UIから追加する方法も説明してください。
