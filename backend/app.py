from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
import os
import jwt
from functools import wraps

app = Flask(__name__)

# CORS configuration for production
CORS(app, origins=[
    "http://localhost:3000",  # Local development
    "https://your-netlify-app.netlify.app",  # Replace with your Netlify URL
    "https://*.netlify.app",  # Allow all Netlify preview deployments
    "https://*.supabase.co"  # Allow Supabase domains
])

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg://postgres:toor@localhost:5433/postgres')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

db = SQLAlchemy(app)

# User model with authentication
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    shortcuts = db.relationship('Shortcut', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'shortcuts_count': len(self.shortcuts)
        }

# Shortcut model
class Shortcut(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # The shortcut keyword (e.g., "google")
    url = db.Column(db.String(500), nullable=False)   # The full URL
    description = db.Column(db.Text)
    category = db.Column(db.String(50), default='general')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_used = db.Column(db.DateTime)
    usage_count = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'description': self.description,
            'category': self.category,
            'created_at': self.created_at.isoformat(),
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'usage_count': self.usage_count
        }

# Auth decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Flask API is running'})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data or 'name' not in data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(name=data['name'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.now(timezone.utc).timestamp() + 86400  # 24 hours
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'User created successfully',
        'token': token,
        'user': user.to_dict()
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.now(timezone.utc).timestamp() + 86400  # 24 hours
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })

@app.route('/api/users', methods=['GET'])
@token_required
def get_users(current_user):
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify(current_user.to_dict())

# Shortcut routes
@app.route('/api/shortcuts', methods=['GET'])
@token_required
def get_shortcuts(current_user):
    shortcuts = Shortcut.query.filter_by(user_id=current_user.id).order_by(Shortcut.created_at.desc()).all()
    return jsonify([shortcut.to_dict() for shortcut in shortcuts])

@app.route('/api/shortcuts', methods=['POST'])
@token_required
def create_shortcut(current_user):
    data = request.get_json()
    
    if not data or 'name' not in data or 'url' not in data:
        return jsonify({'error': 'Name and URL are required'}), 400
    
    # Check if shortcut name already exists for this user
    existing_shortcut = Shortcut.query.filter_by(
        user_id=current_user.id, 
        name=data['name'].lower()
    ).first()
    
    if existing_shortcut:
        return jsonify({'error': 'Shortcut name already exists'}), 400
    
    # Ensure URL has protocol
    url = data['url']
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    shortcut = Shortcut(
        name=data['name'].lower(),  # Store in lowercase for consistency
        url=url,
        description=data.get('description', ''),
        category=data.get('category', 'general'),
        user_id=current_user.id
    )
    
    db.session.add(shortcut)
    db.session.commit()
    
    return jsonify({
        'message': 'Shortcut created successfully',
        'shortcut': shortcut.to_dict()
    }), 201

@app.route('/api/shortcuts/<int:shortcut_id>', methods=['DELETE'])
@token_required
def delete_shortcut(current_user, shortcut_id):
    shortcut = Shortcut.query.filter_by(id=shortcut_id, user_id=current_user.id).first()
    
    if not shortcut:
        return jsonify({'error': 'Shortcut not found'}), 404
    
    db.session.delete(shortcut)
    db.session.commit()
    
    return jsonify({'message': 'Shortcut deleted successfully'})

@app.route('/api/search/<string:query>', methods=['GET'])
@token_required
def search_shortcut(current_user, query):
    shortcut = Shortcut.query.filter_by(
        user_id=current_user.id, 
        name=query.lower()
    ).first()
    
    if shortcut:
        # Update usage statistics
        shortcut.last_used = datetime.now(timezone.utc)
        shortcut.usage_count += 1
        db.session.commit()
        
        return jsonify({
            'found': True,
            'shortcut': shortcut.to_dict()
        })
    
    return jsonify({'found': False})

@app.route('/api/shortcuts/<int:shortcut_id>', methods=['PUT'])
@token_required
def update_shortcut(current_user, shortcut_id):
    shortcut = Shortcut.query.filter_by(id=shortcut_id, user_id=current_user.id).first()
    
    if not shortcut:
        return jsonify({'error': 'Shortcut not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        # Check if new name conflicts with existing shortcuts
        existing = Shortcut.query.filter_by(
            user_id=current_user.id, 
            name=data['name'].lower()
        ).filter(Shortcut.id != shortcut_id).first()
        
        if existing:
            return jsonify({'error': 'Shortcut name already exists'}), 400
        
        shortcut.name = data['name'].lower()
    
    if 'url' in data:
        url = data['url']
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        shortcut.url = url
    
    if 'description' in data:
        shortcut.description = data['description']
    
    if 'category' in data:
        shortcut.category = data['category']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Shortcut updated successfully',
        'shortcut': shortcut.to_dict()
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # Production configuration
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('PORT', 5000))
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)