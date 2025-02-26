from app import db
from datetime import datetime

class GameSession(db.Model):
    """ゲームセッションを管理するモデル"""
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), unique=True, nullable=False)
    score = db.Column(db.Integer, default=0)
    round = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Card(db.Model):
    """カード情報を管理するモデル"""
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.String(16), unique=True, nullable=False)
    type = db.Column(db.String(32), nullable=False)  # engine, tank, fairing, payload
    name = db.Column(db.String(64), nullable=False)
    thrust = db.Column(db.Integer, nullable=True)
    weight = db.Column(db.Integer, nullable=False)
    points = db.Column(db.Integer, nullable=True)
    description = db.Column(db.String(256))

class Mission(db.Model):
    """ミッション情報を管理するモデル"""
    id = db.Column(db.Integer, primary_key=True)
    mission_id = db.Column(db.String(16), unique=True, nullable=False)
    name = db.Column(db.String(64), nullable=False)
    required_thrust = db.Column(db.Integer, nullable=False)
    points = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(256))
