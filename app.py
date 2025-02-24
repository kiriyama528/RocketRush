import os
import random
from flask import Flask, render_template, session, jsonify, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# データベース設定
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
# initialize the app with the extension
db.init_app(app)

# カードデータ（基本装備を除外したマーケット用）
MARKET_CARDS = {
    'engines': [
        {'id': 'e1', 'name': 'Standard Engine', 'thrust': 20, 'weight': 8, 'description': 'Standard rocket engine', 'icon': 'standard-engine'},
        {'id': 'e2', 'name': 'Advanced Engine', 'thrust': 30, 'weight': 12, 'description': 'High performance engine', 'icon': 'advanced-engine'},
        {'id': 'e3', 'name': 'Super Engine', 'thrust': 40, 'weight': 18, 'description': 'Based on SpaceX Raptor', 'icon': 'super-engine'}
    ],
    'fuel': [
        {'id': 'f1', 'name': 'Standard Fuel', 'weight': 4, 'description': 'Standard rocket fuel', 'icon': 'standard-fuel'},
        {'id': 'f2', 'name': 'Efficient Fuel', 'weight': 3, 'description': 'Lightweight fuel mix', 'icon': 'efficient-fuel'},
        {'id': 'f3', 'name': 'Dense Fuel', 'weight': 5, 'description': 'High energy density fuel', 'icon': 'dense-fuel'}
    ],
    'fairings': [
        {'id': 'fair1', 'name': 'Standard Fairing', 'weight': 12, 'description': 'Standard protective shell', 'icon': 'standard-fairing'},
        {'id': 'fair2', 'name': 'Light Fairing', 'weight': 10, 'description': 'Lightweight composite fairing', 'icon': 'light-fairing'},
        {'id': 'fair3', 'name': 'Heavy Fairing', 'weight': 15, 'description': 'Extra protective fairing', 'icon': 'heavy-fairing'}
    ],
    'payloads': [
        {'id': 'p1', 'name': 'Satellite', 'weight': 18, 'points': 5, 'description': 'Communication satellite', 'icon': 'satellite'},
        {'id': 'p2', 'name': 'Space Station Module', 'weight': 22, 'points': 8, 'description': 'ISS module', 'icon': 'space-station'},
        {'id': 'p3', 'name': 'Moon Lander', 'weight': 27, 'points': 12, 'description': 'Lunar expedition module', 'icon': 'moon-lander'}
    ]
}

# 基本装備データ
DEFAULT_CARDS = {
    'engines': {'id': 'e0', 'name': 'Basic Engine', 'thrust': 10, 'weight': 10, 'description': '基本装備のエンジン', 'is_default': True, 'icon': 'basic-engine'},
    'fuel': {'id': 'f0', 'name': 'Basic Fuel', 'weight': 6, 'description': '基本装備の燃料', 'is_default': True, 'icon': 'basic-fuel'},
    'fairings': {'id': 'fair0', 'name': 'Basic Fairing', 'weight': 15, 'description': '基本装備のフェアリング', 'is_default': True, 'icon': 'basic-fairing'},
    'payloads': {'id': 'p0', 'name': 'Basic Payload', 'weight': 20, 'points': 3, 'description': '基本装備のペイロード', 'is_default': True, 'icon': 'basic-payload'}
}

MISSIONS = [
    {'id': 'm1', 'name': 'Orbit Insertion', 'required_thrust': 80, 'points': 5},
    {'id': 'm2', 'name': 'Space Station Resupply', 'required_thrust': 120, 'points': 8},
    {'id': 'm3', 'name': 'Moon Mission', 'required_thrust': 150, 'points': 12}
]

with app.app_context():
    # Make sure to import the models here or their tables won't be created
    from models import GameSession, Card, Mission  # noqa: F401
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new_game')
def new_game():
    # セッションIDがない場合は生成
    if '_id' not in session:
        session['_id'] = os.urandom(16).hex()

    # 既存のゲームセッションを確認
    game_session = GameSession.query.filter_by(session_id=session.get('_id')).first()

    if game_session:
        # 既存のセッションをリセット
        game_session.score = 0
        game_session.round = 1
        db.session.commit()
    else:
        # 新しいゲームセッションを作成
        game_session = GameSession(
            session_id=session.get('_id'),
            score=0,
            round=1
        )
        db.session.add(game_session)
        db.session.commit()

    # 基本装備を初期選択として設定
    session['score'] = 0
    session['round'] = 1
    session['hand'] = list(DEFAULT_CARDS.values())
    session['market'] = _generate_market()
    session['current_mission'] = random.choice(MISSIONS)
    session['selected_cards'] = {} # Initialize selected_cards
    return redirect(url_for('game'))

@app.route('/game')
def game():
    if 'score' not in session:
        return redirect(url_for('new_game'))
    return render_template('game.html',
                         market=session['market'],
                         hand=session['hand'],
                         mission=session['current_mission'],
                         score=session['score'],
                         round=session['round'],
                         selected_cards=session.get('selected_cards',{}))

def _generate_market():
    market = {}
    for card_type, cards in MARKET_CARDS.items():
        market[card_type] = random.choice(cards)
    return market

@app.route('/select_card/<card_type>/<card_id>')
def select_card(card_type, card_id):
    if card_type not in MARKET_CARDS:
        return jsonify({'error': 'Invalid card type'}), 400

    # カードを見つける
    selected_card = None
    for card in MARKET_CARDS[card_type]:
        if card['id'] == card_id:
            selected_card = card
            break

    if not selected_card:
        return jsonify({'error': 'Card not found'}), 404

    # 現在の手札を取得
    hand = session.get('hand', [])

    # 同じ種類のカードを探して置き換え
    for i, card in enumerate(hand):
        # カードの種類を判定
        current_type = None
        if card['id'].startswith('e'):
            current_type = 'engines'
        elif card['id'].startswith('fair'):
            current_type = 'fairings'
        elif card['id'].startswith('f'):
            current_type = 'fuel'
        elif card['id'].startswith('p'):
            current_type = 'payloads'

        if current_type == card_type:
            hand[i] = selected_card
            session['hand'] = hand
            session['selected_cards'] = session.get('selected_cards', {})
            session['selected_cards'][card_type] = card_id
            session.modified = True
            # カードの詳細情報も返す
            return jsonify({
                'success': True,
                'card': selected_card,
                'replaced_index': i
            })

    return jsonify({'error': 'Card type not found in hand'}), 404

@app.route('/remove_card/<card_id>')
def remove_card(card_id):
    hand = session.get('hand', [])
    selected_cards = session.get('selected_cards', {})

    # カードを探して基本装備に置き換え
    for i, card in enumerate(hand):
        if card['id'] == card_id:
            card_type = None
            for type_name, default_card in DEFAULT_CARDS.items():
                if card['id'].startswith(type_name[0]):
                    card_type = type_name
                    break

            if card_type:
                # カードタイプを正確に判定
                if card['id'].startswith('fair'):
                    card_type = 'fairings'
                elif card['id'].startswith('e'):
                    card_type = 'engines'
                elif card['id'].startswith('f'):
                    card_type = 'fuel'
                elif card['id'].startswith('p'):
                    card_type = 'payloads'
                
                hand[i] = DEFAULT_CARDS[card_type]
                session['hand'] = hand
                # 選択状態をリセット
                if card_type in selected_cards:
                    del selected_cards[card_type]
                session['selected_cards'] = selected_cards
                session.modified = True
                return jsonify({'success': True, 'removed_type': card_type})

    return jsonify({'error': 'Card not found'}), 404

@app.route('/launch_rocket', methods=['POST'])
def launch_rocket():
    hand = session.get('hand', [])
    mission = session.get('current_mission')

    total_weight = sum(card.get('weight', 0) for card in hand)
    total_thrust = sum(card.get('thrust', 0) for card in hand if 'thrust' in card)

    success = total_thrust >= total_weight and total_thrust >= mission['required_thrust']

    # スコアの更新（成功時のみ）
    if success:
        session['score'] += mission['points']

    # ラウンドの更新（結果に関わらず）
    session['round'] += 1

    # データベースの更新
    game_session = GameSession.query.filter_by(session_id=session.get('_id')).first()
    if game_session:
        game_session.score = session['score']
        game_session.round = session['round']
        db.session.commit()

    # 次のラウンドの準備（基本装備を初期化）
    session['hand'] = list(DEFAULT_CARDS.values())
    session['market'] = _generate_market()
    session['current_mission'] = random.choice(MISSIONS)
    session['selected_cards'] = {}  # 選択状態をリセット
    session.modified = True

    return jsonify({
        'success': success,
        'total_thrust': total_thrust,
        'total_weight': total_weight,
        'score': session['score'],
        'round': session['round']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)