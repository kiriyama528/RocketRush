import os
import random
from flask import Flask, render_template, session, jsonify, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from game.card_manager import JsonCardProvider, CardManager # Added import
from game.mission_manager import DefaultMissionProvider, MissionManager # Added import

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

# Initialize managers
card_provider = JsonCardProvider('config/cards.json') #Requires cards.json file in config folder
card_manager = CardManager(card_provider)
mission_provider = DefaultMissionProvider()
mission_manager = MissionManager(mission_provider)


# カードデータ（基本装備を除外したマーケット用） - Moved to external file
# MARKET_CARDS = { ... }  Removed

# 基本装備データ - Moved to external file
# DEFAULT_CARDS = { ... } Removed

# ミッションデータ - Moved to external file or handled by mission_manager
# MISSIONS = [ ... ] Removed

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
    session['hand'] = []
    # 各タイプのカードを1つずつ追加
    for card_type in ['fairings', 'payloads', 'fuel_tanks', 'engines']:
        card = card_manager.get_default_card(card_type)
        if card:
            session['hand'].append(card)
    session['market'] = card_manager.generate_market() #Using CardManager
    session['current_mission'] = mission_manager.get_random_mission() #Using MissionManager
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

# _generate_market() function removed.  Functionality now in CardManager

@app.route('/select_card/<card_type>/<card_id>')
def select_card(card_type, card_id):
    if 'hand' not in session:
        return jsonify({'error': 'No active game session'}), 400

    # 新しいカードを選択する
    for card in session['market'].values():
        if card.get('id') == card_id:
            # 同じタイプの既存のカードを探す
            hand = session['hand']
            for i, existing_card in enumerate(hand):
                if existing_card.get('id', '').startswith(card_type[0]):
                    # 既存のカードを新しいカードで置き換える
                    hand[i] = card
                    session.modified = True
                    return jsonify({'success': True})

    return jsonify({'error': 'Card not found'}), 404

@app.route('/remove_card/<card_id>')
def remove_card(card_id):
    # This function needs significant revision to use the CardManager
    # Placeholder - needs implementation using card_manager
    return jsonify({'error': 'Not yet implemented'}), 501

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
    session['hand'] = []
    # 各タイプのカードを1つずつ追加
    for card_type in ['fairings', 'payloads', 'fuel_tanks', 'engines']:
        card = card_manager.get_default_card(card_type)
        if card:
            session['hand'].append(card)
    session['market'] = card_manager.generate_market() #Using CardManager
    session['current_mission'] = mission_manager.get_random_mission() #Using MissionManager
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