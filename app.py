import os
from flask import Flask, render_template, session, jsonify, request, redirect, url_for
import random

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# カードデータ
CARDS = {
    'engines': [
        {'id': 'e1', 'name': 'Basic Engine', 'thrust': 25, 'weight': 10, 'description': 'Standard rocket engine'},
        {'id': 'e2', 'name': 'Advanced Engine', 'thrust': 35, 'weight': 15, 'description': 'High performance engine'},
        {'id': 'e3', 'name': 'Super Engine', 'thrust': 45, 'weight': 20, 'description': 'Based on SpaceX Raptor'}
    ],
    'fuel': [
        {'id': 'f1', 'name': 'Basic Fuel', 'weight': 5, 'description': 'Standard rocket fuel'},
        {'id': 'f2', 'name': 'Efficient Fuel', 'weight': 4, 'description': 'Lightweight fuel mix'},
        {'id': 'f3', 'name': 'Dense Fuel', 'weight': 7, 'description': 'High energy density fuel'}
    ],
    'fairings': [
        {'id': 'fa1', 'name': 'Basic Fairing', 'weight': 15, 'description': 'Standard protective shell'},
        {'id': 'fa2', 'name': 'Light Fairing', 'weight': 12, 'description': 'Lightweight composite fairing'},
        {'id': 'fa3', 'name': 'Heavy Fairing', 'weight': 20, 'description': 'Extra protective fairing'}
    ],
    'payloads': [
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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new_game')
def new_game():
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
    
    card = None
    for c in CARDS[card_type]:
        if c['id'] == card_id:
            card = c
            break
    
    if card:
        session['hand'].append(card)
        session.modified = True
        return jsonify({'success': True})
    return jsonify({'error': 'Card not found'}), 404

@app.route('/launch_rocket', methods=['POST'])
def launch_rocket():
    hand = session.get('hand', [])
    mission = session.get('current_mission')
    
    total_weight = sum(card.get('weight', 0) for card in hand)
    total_thrust = sum(card.get('thrust', 0) for card in hand if 'thrust' in card)
    
    success = total_thrust >= total_weight and total_thrust >= mission['required_thrust']
    
    if success:
        session['score'] += mission['points']
        session['round'] += 1
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
