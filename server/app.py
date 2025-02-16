from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///flex_it_out.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    level = db.Column(db.String(20), default='Beginner')
    workouts = db.relationship('Workout', backref='user', lazy=True)

class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    exercise_type = db.Column(db.String(50), nullable=False)
    reps = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False)

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Registration successful'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'level': user.level
            }
        }), 200
    
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'level': user.level
    }), 200

@app.route('/api/workouts', methods=['POST'])
@jwt_required()
def add_workout():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    new_workout = Workout(
        user_id=current_user_id,
        exercise_type=data['exercise_type'],
        reps=data['reps'],
        date=data['date']
    )
    
    db.session.add(new_workout)
    db.session.commit()
    
    return jsonify({'message': 'Workout added successfully'}), 201

@app.route('/api/workouts', methods=['GET'])
@jwt_required()
def get_workouts():
    current_user_id = get_jwt_identity()
    workouts = Workout.query.filter_by(user_id=current_user_id).all()
    
    return jsonify([{
        'id': w.id,
        'exercise_type': w.exercise_type,
        'reps': w.reps,
        'date': w.date.isoformat()
    } for w in workouts]), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 