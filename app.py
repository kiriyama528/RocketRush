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

# カードデータ
CARDS = {
    'engines': [
        {'id': 'e0', 'name': 'Basic Engine', 'thrust': 15, 'weight': 15, 'description': '基本装備のエンジン', 'is_default': True},
        {'id': 'e1', 'name': 'Standard Engine', 'thrust': 25, 'weight': 10, 'description': 'Standard rocket engine'},
        {'id': 'e2', 'name': 'Advanced Engine', 'thrust': 35, 'weight': 15, 'description': 'High performance engine'},
        {'id': 'e3', 'name': 'Super Engine', 'thrust': 45, 'weight': 20, 'description': 'Based on SpaceX Raptor'}
    ],
    'fuel': [
        {'id': 'f0', 'name': 'Basic Fuel', 'weight': 8, 'description': '基本装備の燃料', 'is_default': True},
        {'id': 'f1', 'name': 'Standard Fuel', 'weight': 5, 'description': 'Standard rocket fuel'},
        {'id': 'f2', 'name': 'Efficient Fuel', 'weight': 4, 'description': 'Lightweight fuel mix'},
        {'id': 'f3', 'name': 'Dense Fuel', 'weight': 7, 'description': 'High energy density fuel'}
    ],
    'fairings': [
        {'id': 'fa0', 'name': 'Basic Fairing', 'weight': 20, 'description': '基本装備のフェアリング', 'is_default': True},
        {'id': 'fa1', 'name': 'Standard Fairing', 'weight': 15, 'description': 'Standard protective shell'},
        {'id': 'fa2', 'name': 'Light Fairing', 'weight': 12, 'description': 'Lightweight composite fairing'},
        {'id': 'fa3', 'name': 'Heavy Fairing', 'weight': 20, 'description': 'Extra protective fairing'}
    ],
    'payloads': [
        {'id': 'p0', 'name': 'Basic Payload', 'weight': 25, 'points': 3, 'description': '基本装備のペイロード', 'is_default': True},
        {'id': 'p1', 'name': 'Satellite', 'weight': 20, 'points': 5, 'description': 'Communication satellite'},
        {'id': 'p2', 'name': 'Space Station Module', 'weight': 25, 'points': 8, 'description': 'ISS module'},
        {'id': 'p3', 'name': 'Moon Lander', 'weight': 30, 'points': 12, 'description': 'Lunar expedition module'}
    ]
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

    # 新しいゲームセッションを作成
    game_session = GameSession(
        session_id=session.get('_id'),
        score=0,
        round=1
    )
    db.session.add(game_session)
    db.session.commit()

    session['score'] = 0
    session['round'] = 1
    session['hand'] = []
    session['market'] = _generate_market()
    session['current_mission'] = random.choice(MISSIONS)
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
                         round=session['round'])

def _generate_market():
    market = {
        'engines': random.choice(CARDS['engines']),
        'fuel': random.choice(CARDS['fuel']),
        'fairings': random.choice(CARDS['fairings']),
        'payloads': random.choice(CARDS['payloads'])
    }
    return market

@app.route('/select_card/<card_type>/<card_id>')
def select_card(card_type, card_id):
    if card_type not in CARDS:
        return jsonify({'error': 'Invalid card type'}), 400

    # カードを見つける
    selected_card = None
    for card in CARDS[card_type]:
        if card['id'] == card_id:
            selected_card = card
            break

    if not selected_card:
        return jsonify({'error': 'Card not found'}), 404

    # 現在の手札を取得
    hand = session.get('hand', [])

    # 同じ種類のカードを探す
    for i, card in enumerate(hand):
        if card['id'].startswith(card_type[0]):  # IDの先頭文字で種類を判断
            # 同じカードが選択された場合は取り外し
            if card['id'] == card_id:
                hand.pop(i)
                session['hand'] = hand
                session.modified = True
                return jsonify({'success': True, 'action': 'removed'})
            # 異なるカードの場合は置き換え
            hand[i] = selected_card
            session['hand'] = hand
            session.modified = True
            return jsonify({'success': True, 'action': 'replaced'})

    # 新しいカードを追加
    hand.append(selected_card)
    session['hand'] = hand
    session.modified = True
    return jsonify({'success': True, 'action': 'added'})

@app.route('/launch_rocket', methods=['POST'])
def launch_rocket():
    hand = session.get('hand', [])
    mission = session.get('current_mission')

    # 基本装備の適用
    used_types = {card['id'][0] for card in hand}  # 選択されているカードの種類

    # 不足しているパーツを基本装備で補完
    for card_type, cards in CARDS.items():
        type_prefix = card_type[0]
        if type_prefix not in used_types:
            default_card = next(card for card in cards if card.get('is_default'))
            hand.append(default_card)

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

    # 次のラウンドの準備
    session['hand'] = []
    session['market'] = _generate_market()
    session['current_mission'] = random.choice(MISSIONS)
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