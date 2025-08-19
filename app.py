# app.py

from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from datetime import datetime, timedelta, UTC
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

import os
from dotenv import load_dotenv
import smtplib
import folium
import requests
import logging
import json
import jwt
import bcrypt
import random

from twilio.rest import Client
from geopy.geocoders import Nominatim

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from werkzeug.security import check_password_hash, generate_password_hash

from datetime import datetime
from zoneinfo import ZoneInfo
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
UTC = ZoneInfo("UTC")

# Configure logging
# ---------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------------------------------
# Load environment variables
# ---------------------------------------------------
load_dotenv()

# ---------------------------------------------------
# Initialize Flask app
# ---------------------------------------------------
app = Flask(__name__)

# ---------------------------------------------------
# Configure database
# ---------------------------------------------------
# DATABASE_URL must be set in Railway environment variables
database_url = os.getenv('DATABASE_URL', 'sqlite:///womecare.db')

# Convert old-style postgres URLs to SQLAlchemy-compatible
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret-key')

# Add connection pool settings for better PostgreSQL handling
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 120,
    'pool_pre_ping': True,
    'pool_timeout': 30,
    'connect_args': {
        'sslmode': 'require',
        'connect_timeout': 10
    } if database_url.startswith('postgresql://') else {}
}

# ---------------------------------------------------
# Initialize SQLAlchemy and Migrate
# ---------------------------------------------------
db.init_app(app)
migrate = Migrate(app, db)

# ---------------------------------------------------
# Configure CORS
# ---------------------------------------------------
CORS(app, resources={
    r"/api/*": {
        "origins": [
            # Local development
            "http://localhost:8501",
            "http://127.0.0.1:8501",
            "http://localhost:3000",

            # Production frontend (Vercel)
            "https://womencare-frontend.vercel.app",

            # Preview deployments
            "https://womencare-frontend-git-main-krishnashetty8217-8376s-projects.vercel.app",
            "https://womencare-frontend-ftv9w12vx-krishnashetty8217-8376s-projects.vercel.app"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ---------------------------------------------------
# Configure SocketIO
# ---------------------------------------------------
socketio = SocketIO(app, cors_allowed_origins=[
    # Local development
    "http://localhost:8501",
    "http://127.0.0.1:8501",
    "http://localhost:3000",

    # Production frontend
    "https://womencare-frontend.vercel.app",

    # Preview deployments
    "https://womencare-frontend-git-main-krishnashetty8217-8376s-projects.vercel.app",
    "https://womencare-frontend-ftv9w12vx-krishnashetty8217-8376s-projects.vercel.app"
])

# Test root route to confirm server is running
@app.route("/", methods=["GET"])
def home():
    return "🚀 Flask server running locally on port 5001"

TWILIO_CONFIG = {
    'account_sid': os.getenv('TWILIO_ACCOUNT_SID'),
    'auth_token': os.getenv('TWILIO_AUTH_TOKEN'),
    'phone_number': os.getenv('TWILIO_PHONE_NUMBER')
}

EMAIL_CONFIG = {
    'user': os.getenv('EMAIL_USER'),
    'password': os.getenv('EMAIL_PASSWORD'),
    'server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'port': int(os.getenv('SMTP_PORT', 587))
}

Maps_API_KEY = os.getenv('Maps_API_KEY')

# --- Database Models ---
from datetime import datetime
from zoneinfo import ZoneInfo
from flask_sqlalchemy import SQLAlchemy

UTC = ZoneInfo("UTC")

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    age = db.Column(db.Integer)
    blood_group = db.Column(db.String(5))
    medical_conditions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contact'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50))
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(100))
    is_primary = db.Column(db.Boolean, default=False)

class Guardian(db.Model):
    __tablename__ = 'guardian'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50))
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(100))
    address = db.Column(db.Text)

class LocationLog(db.Model):
    __tablename__ = 'location_log'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float)
    altitude = db.Column(db.Float)
    heading = db.Column(db.Float)
    speed = db.Column(db.Float)
    address = db.Column(db.String(500))
    location_source = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(ZoneInfo('UTC')))
    is_high_accuracy = db.Column(db.Boolean)

class MedicationReminder(db.Model):
    __tablename__ = 'medication_reminder'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    medication_name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(50))
    frequency = db.Column(db.String(50))
    time_schedule = db.Column(db.String(100))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)

class PeriodTracker(db.Model):
    __tablename__ = 'period_tracker'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    cycle_start_date = db.Column(db.Date, nullable=False)
    cycle_length = db.Column(db.Integer, default=28)
    period_length = db.Column(db.Integer, default=5)
    flow_intensity = db.Column(db.String(20))
    symptoms = db.Column(db.Text)
    mood = db.Column(db.String(50))
    notes = db.Column(db.Text)

class SOSAlert(db.Model):
    __tablename__ = 'sos_alert'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    accuracy = db.Column(db.Float)
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')
    additional_info = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)

# --- Maternity Models ---
class PregnancyTracker(db.Model):
    __tablename__ = 'pregnancy_tracker'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    last_menstrual_period = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(ZoneInfo('UTC')))
    user = db.relationship('User', backref=db.backref('pregnancy_tracker', uselist=False))

class MaternityGuide(db.Model):
    __tablename__ = 'maternity_guide'
    id = db.Column(db.Integer, primary_key=True)
    week = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String(200))
    baby_development = db.Column(db.Text)
    mother_changes = db.Column(db.Text)
    tips = db.Column(db.Text)
    image_url = db.Column(db.String(255))

class PregnancySymptom(db.Model):
    __tablename__ = 'pregnancy_symptom'
    id = db.Column(db.Integer, primary_key=True)
    pregnancy_id = db.Column(db.Integer, db.ForeignKey('pregnancy_tracker.id'), nullable=False)
    symptom_name = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.Integer)
    notes = db.Column(db.Text)
    log_date = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

class KickCount(db.Model):
    __tablename__ = 'kick_count'
    id = db.Column(db.Integer, primary_key=True)
    pregnancy_id = db.Column(db.Integer, db.ForeignKey('pregnancy_tracker.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    kick_count = db.Column(db.Integer, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)

class Contraction(db.Model):
    __tablename__ = 'contraction'
    id = db.Column(db.Integer, primary_key=True)
    pregnancy_id = db.Column(db.Integer, db.ForeignKey('pregnancy_tracker.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    duration_seconds = db.Column(db.Integer)
    frequency_minutes = db.Column(db.Integer)

# --- Community Forum Models ---
class CommunityPost(db.Model):
    __tablename__ = 'community_post'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, onupdate=lambda: datetime.now(UTC))

class CommunityComment(db.Model):
    __tablename__ = 'community_comment'
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('community_post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

# --- Helper Functions ---
def populate_maternity_guide():
    """Populates the database with sample maternity guide data."""
    if db.session.query(MaternityGuide).count() == 0:
        logger.info("Populating Maternity Guide data...")

        guides = []

        # Weeks 1 to 10
        week_info_1_to_10 = [
            {'week': 1, 'title': 'Week 1: The Starting Line', 'baby_development': 'Technically, pregnancy is counted from the first day of your last period. No baby yet — ovulation will occur later.', 'mother_changes': 'Your body is preparing for ovulation.', 'tips': 'Maintain a healthy diet and track your cycle.'},
            {'week': 2, 'title': 'Week 2: Ovulation Approaches', 'baby_development': 'Egg is maturing in your ovary.', 'mother_changes': 'You might notice increased cervical mucus.', 'tips': 'Have a balanced diet rich in protein.'},
            {'week': 3, 'title': 'Week 3: Fertilization', 'baby_development': 'Fertilization happens! Your baby is now a tiny ball of cells.', 'mother_changes': "You won't notice physical changes yet.", 'tips': 'Avoid alcohol and smoking.'},
            {'week': 4, 'title': 'Week 4: The Poppy Seed', 'baby_development': 'Your baby is the size of a poppy seed. Neural tube starts forming.', 'mother_changes': 'A missed period might be the first sign.', 'tips': 'Start prenatal vitamins with folic acid.'},
            {'week': 5, 'title': 'Week 5: The Sesame Seed', 'baby_development': 'Heart starts beating. Major organs begin forming.', 'mother_changes': 'Morning sickness may start.', 'tips': 'Eat small, frequent meals.'},
            {'week': 6, 'title': 'Week 6: The Lentil', 'baby_development': 'Facial features begin forming.', 'mother_changes': 'Fatigue and nausea are common.', 'tips': 'Stay hydrated and rest often.'},
            {'week': 7, 'title': 'Week 7: The Blueberry', 'baby_development': 'Hands and feet start developing.', 'mother_changes': 'You may notice breast tenderness.', 'tips': 'Wear a supportive bra.'},
            {'week': 8, 'title': 'Week 8: The Raspberry', 'baby_development': 'Tiny fingers and toes are forming.', 'mother_changes': 'Morning sickness may peak.', 'tips': 'Get plenty of rest.'},
            {'week': 9, 'title': 'Week 9: The Grape', 'baby_development': "Baby's tail disappears, looking more human.", 'mother_changes': 'Possible mood swings.', 'tips': 'Practice relaxation techniques.'},
            {'week': 10, 'title': 'Week 10: The Strawberry', 'baby_development': 'Vital organs are now fully formed.', 'mother_changes': 'Nausea may start to ease.', 'tips': 'Begin light prenatal exercise.'},
        ]
        guides.extend(week_info_1_to_10)

        # Random 5 weeks from 11–40
        random_weeks = random.sample(range(11, 41), 5)
        week_info_extra = {
            12: {'title': 'Week 12: The Plum', 'baby_development': 'Baby can squint and suck its thumb.', 'mother_changes': 'Morning sickness might ease.', 'tips': 'Consider sharing your news.'},
            20: {'title': 'Week 20: The Banana', 'baby_development': 'Halfway there! First movements felt.', 'mother_changes': 'Energy boost in 2nd trimester.', 'tips': 'Schedule mid-pregnancy ultrasound.'},
            25: {'title': 'Week 25: The Cauliflower', 'baby_development': 'Lungs developing air sacs.', 'mother_changes': 'Possible backaches.', 'tips': 'Maintain good posture.'},
            30: {'title': 'Week 30: The Cabbage', 'baby_development': 'Brain developing rapidly.', 'mother_changes': 'Shortness of breath possible.', 'tips': 'Sleep on your side.'},
            35: {'title': 'Week 35: The Honeydew Melon', 'baby_development': 'Baby gains weight quickly.', 'mother_changes': 'Braxton Hicks contractions.', 'tips': 'Pack your hospital bag.'},
            40: {'title': 'Week 40: The Watermelon', 'baby_development': 'Fully developed and ready for birth.', 'mother_changes': 'Full-term! Watch for labor signs.', 'tips': 'Rest and stay prepared.'}
        }

        for wk in random_weeks:
            if wk in week_info_extra:
                data = week_info_extra[wk]
                guides.append({
                    'week': wk,
                    'title': data['title'],
                    'baby_development': data['baby_development'],
                    'mother_changes': data['mother_changes'],
                    'tips': data['tips']
                })

        # Save to DB
        for guide_data in guides:
            guide = MaternityGuide(**guide_data)
            db.session.add(guide)
        
        try:
            db.session.commit()
            logger.info("Maternity Guide data populated.")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to populate maternity guide: {str(e)}")

def test_db_connection():
    """Test database connection and create tables if needed."""
    try:
        with app.app_context():
            # Test connection
            db.session.execute(text('SELECT 1'))
            logger.info("Database connection successful")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

def init_db():
    """Initialize database with better error handling and retry logic."""
    max_retries = 3
    retry_delay = 2
    
    with app.app_context():
        for attempt in range(max_retries):
            try:
                logger.info(f"Database initialization attempt {attempt + 1}/{max_retries}")
                
                # Test connection first
                if not test_db_connection():
                    raise Exception("Database connection test failed")
                
                # Create all tables
                db.create_all()
                logger.info("Database tables created successfully")
                
                # Populate sample data
                populate_maternity_guide()
                
                logger.info("Database initialized successfully")
                return True
                
            except Exception as e:
                logger.error(f"Database initialization attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    import time
                    time.sleep(retry_delay)
                else:
                    logger.error("All database initialization attempts failed")
                    raise e

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Railway deployment"""
    try:
        # Test database connection
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now(UTC).isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now(UTC).isoformat()
        }), 500

def validate_location_data(data):
    if not all(key in data for key in ['latitude', 'longitude']):
        raise ValueError('Missing required fields: latitude, longitude')

    try:
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            raise ValueError('Invalid coordinate range')
        if latitude == 0 and longitude == 0:
            raise ValueError('Invalid coordinates: 0,0')
    except (ValueError, TypeError):
        raise ValueError('Invalid coordinate format')

    return {
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': float(data.get('accuracy', 0)) if data.get('accuracy') is not None else None,
        'altitude': float(data.get('altitude', 0)) if data.get('altitude') is not None else None,
        'heading': float(data.get('heading', 0)) if data.get('heading') is not None else None,
        'speed': float(data.get('speed', 0)) if data.get('speed') is not None else None,
        'location_source': data.get('location_source', 'gps'),
        'is_high_accuracy': data.get('accuracy') is not None and float(data.get('accuracy', 0)) <= 50
    }

def get_detailed_address(latitude, longitude):
    try:
        if Maps_API_KEY:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'latlng': f"{latitude},{longitude}",
                'key': Maps_API_KEY,
                'result_type': 'street_address|premise|subpremise'
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200 and response.json()['results']:
                result = response.json()['results'][0]
                return {
                    'full_address': result['formatted_address'],
                    'components': result.get('address_components', []),
                    'place_id': result.get('place_id'),
                    'accuracy': 'HIGH' if result.get('geometry', {}).get('location_type') == 'ROOFTOP' else 'MEDIUM'
                }

        geolocator = Nominatim(user_agent="womecare_app", timeout=10)
        location = geolocator.reverse(f"{latitude}, {longitude}", exactly_one=True)
        if location:
            return {
                'full_address': location.address,
                'components': location.raw.get('address', {}),
                'place_id': location.raw.get('place_id'),
                'accuracy': 'MEDIUM'
            }
        return None
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        return None

def get_accuracy_description(accuracy):
    if accuracy is None:
        return "Unknown"
    thresholds = [
        (5, "Excellent"),
        (10, "Very Good"),
        (20, "Good"),
        (50, "Fair"),
        (100, "Poor")
    ]
    for threshold, description in thresholds:
        if accuracy <= threshold:
            return f"{description} (<{threshold}m)"
    return f"Very Poor ({accuracy:.0f}m)"

def create_location_map(latitude, longitude, user_name, accuracy=None):
    try:
        map_obj = folium.Map(
            location=[latitude, longitude],
            zoom_start=18 if accuracy and accuracy <= 50 else 16
        )
        folium.Marker(
            [latitude, longitude],
            popup=f"{user_name}'s Emergency Location<br>Accuracy: {accuracy}m" if accuracy else f"{user_name}'s Emergency Location",
            icon=folium.Icon(color='red', icon='exclamation-triangle', prefix='fa')
        ).add_to(map_obj)

        if accuracy:
            folium.Circle(
                location=[latitude, longitude],
                radius=accuracy,
                color='blue',
                fill=True,
                fillOpacity=0.2
            ).add_to(map_obj)

        map_filename = f"emergency_location_{user_name}_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.html"
        map_path = os.path.join('/tmp', map_filename)
        map_obj.save(map_path)
        return map_path
    except Exception as e:
        logger.error(f"Map creation error: {str(e)}")
        return None

def send_emergency_email(email, user_name, message, latitude=None, longitude=None, accuracy=None):
    try:
        if not all([EMAIL_CONFIG['user'], EMAIL_CONFIG['password']]):
            logger.warning("Email credentials not configured")
            return

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'🚨 EMERGENCY ALERT - {user_name}'
        msg['From'] = EMAIL_CONFIG['user']
        msg['To'] = email

        current_time = datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')
        address_info = get_detailed_address(latitude, longitude)['full_address'] if latitude and longitude else ""
        maps_link = f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}" if latitude and longitude else ""
        maps_directions = f"https://www.google.com/maps/dir/?api=1&destination={latitude},{longitude}" if latitude and longitude else ""
        accuracy_info = f"Accuracy: {get_accuracy_description(accuracy)}" if accuracy else ""

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }}
                .alert-box {{ background: #ffe6e6; border: 2px solid #ff4444; padding: 15px; border-radius: 8px; }}
                .map-link {{ display: inline-block; background: #007bff; color: white; padding: 10px; text-decoration: none; border-radius: 5px; margin: 10px; }}
                .emergency-info {{ background: #e9ecef; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="alert-box">
                <h2>🚨 EMERGENCY ALERT: {user_name}</h2>
                <p><strong>Time:</strong> {current_time}</p>
                <p><strong>Message:</strong> {message}</p>
                {"<h3>Location</h3>" if latitude and longitude else ""}
                {"<p>Latitude: " + str(latitude) + "</p>" if latitude else ""}
                {"<p>Longitude: " + str(longitude) + "</p>" if longitude else ""}
                {"<p>Address: " + address_info + "</p>" if address_info else ""}
                {"<p>" + accuracy_info + "</p>" if accuracy_info else ""}
                {"<div style='text-align: center;'>" if latitude and longitude else ""}
                {"<a href='" + maps_link + "' class='map-link'>View on Google Maps</a>" if maps_link else ""}
                {"<a href='" + maps_directions + "' class='map-link'>Get Directions</a>" if maps_directions else ""}
                {"</div>" if latitude and longitude else ""}
            </div>
            <div class="emergency-info">
                <h3>🆘 WHAT TO DO:</h3>
                <ol>
                    <li>Call {user_name} immediately</li>
                    <li>If no response, contact emergency services:
                        <ul>
                            <li>Ambulance: 108</li>
                            <li>Police: 100</li>
                            <li>Fire: 101</li>
                            <li>Women Helpline: 1091</li>
                        </ul>
                    </li>
                    <li>Use location links to reach them</li>
                </ol>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        EMERGENCY ALERT: {user_name}
        Time: {current_time}
        Message: {message}
        {'Location:' if latitude and longitude else ''}
        {f'Latitude: {latitude}' if latitude else ''}
        {f'Longitude: {longitude}' if longitude else ''}
        {f'Address: {address_info}' if address_info else ''}
        {accuracy_info}
        {maps_link}
        """

        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        map_path = create_location_map(latitude, longitude, user_name, accuracy) if latitude and longitude else None
        if map_path and os.path.exists(map_path):
            with open(map_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename={os.path.basename(map_path)}')
            msg.attach(part)

        with smtplib.SMTP(EMAIL_CONFIG['server'], EMAIL_CONFIG['port']) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(msg)

        logger.info(f"Emergency email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {str(e)}")

def send_emergency_sms(phone, user_name, message, latitude=None, longitude=None, accuracy=None):
    try:
        if not all(TWILIO_CONFIG.values()):
            logger.warning("Twilio credentials not configured")
            return

        location_text = f"\nLocation: https://www.google.com/maps/search/?api=1&query={latitude},{longitude}" if latitude and longitude else ""
        sms_message = f'EMERGENCY: {user_name} needs help! {message}{location_text}'

        client = Client(TWILIO_CONFIG['account_sid'], TWILIO_CONFIG['auth_token'])
        client.messages.create(
            body=sms_message,
            from_=TWILIO_CONFIG['phone_number'],
            to=phone
        )
        logger.info(f"SMS sent to {phone}")
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone}: {str(e)}")

# --- API Endpoints ---

@app.route('/', methods=['GET'])
def index():
    return "Welcome to the Womecare Backend API! Please refer to the documentation for available endpoints.", 200

# --- User Management Endpoints ---
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login_user():
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS request for /api/login")
        return make_response('', 200)

    try:
        data = request.get_json()
        email = data.get('email')
        phone = data.get('phone')

        if not email or not phone:
            return jsonify({'error': 'Email and phone are required'}), 400

        user = db.session.query(User).filter_by(email=email, phone=phone).first()

        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        token_payload = {
            'user_id': user.id,
            'exp': datetime.now(UTC) + timedelta(days=1)
        }
        token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm='HS256')

        logger.info(f"User logged in: ID {user.id}, Email {user.email}")
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user_id': user.id,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
                'age': user.age,
                'blood_group': user.blood_group,
                'medical_conditions': user.medical_conditions
            }
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': f'An error occurred during login: {str(e)}'}), 500

@app.route('/api/users', methods=['POST', 'OPTIONS'])
def create_user():
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS request for /api/users")
        return make_response('', 200)

    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            data = request.get_json()
            if not data or not all(key in data for key in ['name', 'email', 'phone']):
                logger.warning(f"Invalid user creation request: {data}")
                return jsonify({'error': 'Missing required fields: name, email, phone'}), 400

            # Clean empty strings to None for optional fields
            age = data.get('age') if data.get('age') and data.get('age').strip() else None
            blood_group = data.get('blood_group') if data.get('blood_group') and data.get('blood_group').strip() else None
            medical_conditions = data.get('medical_conditions') if data.get('medical_conditions') and data.get('medical_conditions').strip() else None

            user = User(
                name=data['name'].strip(),
                email=data['email'].strip().lower(),
                phone=data['phone'].strip(),
                age=int(age) if age else None,
                blood_group=blood_group,
                medical_conditions=medical_conditions
            )
            
            db.session.add(user)
            db.session.commit()
            
            logger.info(f"User created successfully: ID {user.id}, Email {user.email}")

            token_payload = {
                'user_id': user.id,
                'exp': datetime.now(UTC) + timedelta(days=1)
            }
            token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                'message': 'User created successfully',
                'user_id': user.id,
                'token': token,
                'user': {
                    'id': user.id, 'name': user.name, 'email': user.email, 'phone': user.phone,
                    'age': user.age, 'blood_group': user.blood_group, 'medical_conditions': user.medical_conditions
                }
            }), 201
            
        except IntegrityError as e:
            db.session.rollback()
            logger.warning(f"Email already exists: {data.get('email')}")
            return jsonify({'error': 'Email already exists'}), 400
            
        except Exception as e:
            db.session.rollback()
            error_msg = str(e)
            logger.error(f"User creation attempt {attempt + 1} failed: {error_msg}")
            
            # Check if it's a connection issue that should be retried
            if any(keyword in error_msg.lower() for keyword in ['ssl', 'eof', 'connection', 'timeout']) and attempt < max_retries - 1:
                logger.info(f"Retrying user creation in {retry_delay} seconds...")
                import time
                time.sleep(retry_delay)
                continue
            else:
                return jsonify({'error': f'Failed to create user: {error_msg}'}), 500

@app.route('/api/users/email/<string:email>', methods=['GET'])
def check_email(email):
    try:
        user = db.session.query(User).filter_by(email=email).first()
        logger.info(f"Email check: {email}, exists: {bool(user)}")
        return jsonify({'exists': bool(user)}), 200
    except Exception as e:
        logger.error(f"Email check error for {email}: {str(e)}")
        return jsonify({'error': f'Error checking email: {str(e)}'}), 500

@app.route('/api/users/<int:user_id>', methods=['GET', 'PUT'])
def manage_user(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            logger.warning(f"User not found: ID {user_id}")
            return jsonify({'error': 'User not found'}), 404

        if request.method == 'GET':
            logger.info(f"User fetched: ID {user_id}")
            return jsonify({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
                'age': user.age,
                'blood_group': user.blood_group,
                'medical_conditions': user.medical_conditions
            }), 200

        if request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided for update'}), 400

            user.name = data.get('name', user.name)
            user.email = data.get('email', user.email)
            user.phone = data.get('phone', user.phone)
            user.age = data.get('age', user.age)
            user.blood_group = data.get('blood_group', user.blood_group)
            user.medical_conditions = data.get('medical_conditions', user.medical_conditions)

            db.session.commit()
            logger.info(f"User updated: ID {user_id}")
            return jsonify({
                'message': 'User profile updated successfully',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'phone': user.phone,
                    'age': user.age,
                    'blood_group': user.blood_group,
                    'medical_conditions': user.medical_conditions
                }
            }), 200

    except IntegrityError:
        db.session.rollback()
        logger.warning(f"Email already exists during update: {request.get_json().get('email')}")
        return jsonify({'error': 'Email already exists'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"User management error for ID {user_id}: {str(e)}")
        return jsonify({'error': f'Error managing user: {str(e)}'}), 500

# --- Emergency Contact Endpoints ---
@app.route('/api/emergency-contacts/<int:user_id>/<int:contact_id>', methods=['DELETE'])
def delete_emergency_contact(user_id, contact_id):
    try:
        contact = db.session.query(EmergencyContact).filter_by(id=contact_id, user_id=user_id).first()
        if not contact:
            logger.warning(f"Emergency contact not found: ID {contact_id}, User {user_id}")
            return jsonify({'error': 'Emergency contact not found'}), 404

        db.session.delete(contact)
        db.session.commit()
        logger.info(f"Emergency contact deleted: ID {contact_id} for user {user_id}")
        return jsonify({'message': 'Emergency contact deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete emergency contact {contact_id} for user {user_id}: {str(e)}")
        return jsonify({'error': f'Failed to delete contact: {str(e)}'}), 500

@app.route('/api/emergency-contacts/<int:user_id>', methods=['GET', 'POST', 'OPTIONS'])
def manage_emergency_contacts(user_id):
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS request for /api/emergency-contacts")
        return make_response('', 200)

    try:
        user = db.session.get(User, user_id)
        if not user:
            logger.warning(f"User not found for emergency contacts: ID {user_id}")
            return jsonify({'error': 'User not found'}), 404

        if request.method == 'GET':
            contacts = db.session.query(EmergencyContact).filter_by(user_id=user_id).all()
            logger.info(f"Fetched {len(contacts)} emergency contacts for user {user_id}")
            return jsonify({
                'contacts': [{
                    'id': contact.id,
                    'name': contact.name,
                    'relationship': contact.relationship,
                    'phone': contact.phone,
                    'email': contact.email,
                    'is_primary': contact.is_primary
                } for contact in contacts],
                'count': len(contacts)
            }), 200

        if request.method == 'POST':
            data = request.get_json()
            if not data or not all(key in data for key in ['name', 'phone']):
                logger.warning(f"Invalid emergency contact data: {data}")
                return jsonify({'error': 'Missing required fields: name, phone'}), 400

            contact = EmergencyContact(
                user_id=user_id,
                name=data['name'],
                phone=data['phone'],
                email=data.get('email'),
                relationship=data.get('relationship'),
                is_primary=data.get('is_primary', False)
            )
            db.session.add(contact)
            db.session.commit()
            logger.info(f"Emergency contact added for user {user_id}: {contact.name}")
            return jsonify({
                'message': 'Emergency contact added successfully',
                'contact_id': contact.id
            }), 201

    except IntegrityError:
        db.session.rollback()
        logger.warning(f"Duplicate emergency contact data for user {user_id}")
        return jsonify({'error': 'Duplicate contact data'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Emergency contact error for user {user_id}: {str(e)}")
        return jsonify({'error': f'Error managing emergency contact: {str(e)}'}), 500

# --- Dashboard Endpoint ---
@app.route('/api/dashboard/<int:user_id>', methods=['GET', 'OPTIONS'])
def get_dashboard(user_id):
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS request for /api/dashboard")
        return make_response('', 200)

    try:
        user = db.session.get(User, user_id)
        if not user:
            logger.warning(f"User not found for dashboard: ID {user_id}")
            return jsonify({'error': 'User not found'}), 404

        # Emergency Contacts
        contacts = db.session.query(EmergencyContact).filter_by(user_id=user_id).all()
        contacts_data = [{
            'id': contact.id, 'name': contact.name, 'relationship': contact.relationship,
            'phone': contact.phone, 'email': contact.email, 'is_primary': contact.is_primary
        } for contact in contacts]

        # Recent Locations
        locations = db.session.query(LocationLog).filter_by(user_id=user_id).filter(
            LocationLog.timestamp >= datetime.now(UTC) - timedelta(hours=24)
        ).order_by(LocationLog.timestamp.desc()).limit(10).all()
        locations_data = [{
            'id': loc.id, 'latitude': loc.latitude, 'longitude': loc.longitude, 'accuracy': loc.accuracy,
            'accuracy_description': get_accuracy_description(loc.accuracy), 'address': loc.address,
            'timestamp': loc.timestamp.isoformat()
        } for loc in locations]

        # SOS Alerts
        sos_alerts = db.session.query(SOSAlert).filter_by(user_id=user_id).filter(
            SOSAlert.created_at >= datetime.now(UTC) - timedelta(days=7)
        ).order_by(SOSAlert.created_at.desc()).limit(5).all()
        sos_data = [{
            'id': alert.id, 'alert_type': alert.alert_type, 'message': alert.message, 'status': alert.status,
            'latitude': alert.latitude, 'longitude': alert.longitude, 'accuracy': alert.accuracy,
            'created_at': alert.created_at.isoformat(),
            'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None
        } for alert in sos_alerts]

        # Pregnancy Tracker Summary
        pregnancy = db.session.query(PregnancyTracker).filter_by(user_id=user_id, is_active=True).first()
        pregnancy_data = None
        if pregnancy:
            days_pregnant = (datetime.now(UTC).date() - pregnancy.last_menstrual_period).days
            current_week = (days_pregnant // 7) + 1
            pregnancy_data = {
                'is_tracking': True,
                'due_date': pregnancy.due_date.isoformat(),
                'current_week': current_week,
                'trimester': (current_week - 1) // 13 + 1
            }

        logger.info(f"Dashboard data fetched for user {user_id}")
        return jsonify({
            'user': {
                'id': user.id, 'name': user.name, 'email': user.email, 'phone': user.phone,
                'age': user.age, 'blood_group': user.blood_group, 'medical_conditions': user.medical_conditions
            },
            'emergency_contacts': contacts_data,
            'recent_locations': locations_data,
            'sos_alerts': sos_data,
            'pregnancy_tracker': pregnancy_data
        }), 200

    except Exception as e:
        logger.error(f"Dashboard error for user {user_id}: {str(e)}")
        return jsonify({'error': f'Error fetching dashboard data: {str(e)}'}), 500

# --- Location and SOS Endpoints ---
@app.route('/api/location/<int:user_id>/live', methods=['POST'])
def update_live_location(user_id):
    try:
        data = request.get_json()
        if not data:
            logger.warning("No location data provided")
            return jsonify({'error': 'No location data provided'}), 400

        location_data = validate_location_data(data)
        address = get_detailed_address(location_data['latitude'], location_data['longitude'])

        location = LocationLog(
            user_id=user_id,
            address=address['full_address'] if address else None,
            **location_data
        )
        db.session.add(location)
        db.session.commit()

        logger.info(f"Location updated for user {user_id}")
        return jsonify({
            'message': 'Location updated',
            'location': {
                'id': location.id,
                'latitude': location_data['latitude'],
                'longitude': location_data['longitude'],
                'accuracy': location_data['accuracy'],
                'accuracy_description': get_accuracy_description(location_data['accuracy']),
                'altitude': location_data['altitude'],
                'heading': location_data['heading'],
                'speed': location_data['speed'],
                'address': location.address,
                'location_source': location_data['location_source'],
                'timestamp': location.timestamp.isoformat()
            }
        }), 201
    except ValueError as e:
        logger.warning(f"Invalid location data: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Location update error for user {user_id}: {str(e)}")
        return jsonify({'error': f'Error updating location: {str(e)}'}), 500

@app.route('/api/sos/<int:user_id>', methods=['POST'])
def trigger_sos(user_id):
    try:
        data = request.get_json() or {}
        user = db.session.get(User, user_id)
        if not user:
            logger.warning(f"User not found for SOS: ID {user_id}")
            return jsonify({'error': 'User not found'}), 404

        location_data = {}
        if data.get('latitude') is not None and data.get('longitude') is not None:
            try:
                location_data = validate_location_data(data)
            except ValueError as e:
                logger.warning(f"Invalid SOS location data: {str(e)}")
                location_data = {'latitude': None, 'longitude': None, 'accuracy': None, 'is_high_accuracy': False}
        else:
            latest_location = db.session.query(LocationLog).filter_by(user_id=user_id).order_by(LocationLog.timestamp.desc()).first()
            if latest_location:
                location_data = {
                    'latitude': latest_location.latitude,
                    'longitude': latest_location.longitude,
                    'accuracy': latest_location.accuracy,
                    'is_high_accuracy': latest_location.is_high_accuracy
                }

        sos_alert_location_data = {
            'latitude': location_data.get('latitude'),
            'longitude': location_data.get('longitude'),
            'accuracy': location_data.get('accuracy')
        }

        sos_alert = SOSAlert(
            user_id=user_id,
            alert_type=data.get('alert_type', 'emergency'),
            message=data.get('message', 'Emergency assistance needed'),
            additional_info=json.dumps(data.get('additional_info', {})),
            **sos_alert_location_data
        )
        db.session.add(sos_alert)
        db.session.commit()

        contacts = db.session.query(EmergencyContact).filter_by(user_id=user_id).all() + \
                     db.session.query(Guardian).filter_by(user_id=user_id).all()
        notifications = []
        errors = []

        alert_data_for_socket = {
            'user_id': user.id,
            'name': user.name,
            'message': sos_alert.message,
            'alert_id': sos_alert.id,
            'latitude': sos_alert.latitude,
            'longitude': sos_alert.longitude,
            'accuracy': sos_alert.accuracy,
            'address': get_detailed_address(sos_alert.latitude, sos_alert.longitude)['full_address'] if sos_alert.latitude and sos_alert.longitude else 'Unknown Location',
            'timestamp': sos_alert.created_at.isoformat()
        }

        socketio.emit('sos_alert', alert_data_for_socket, room=str(user.id))
        socketio.emit('sos_alert_global', alert_data_for_socket)
        logger.info(f"SOS alert emitted via Socket.IO for user {user.id}")

        for contact in contacts:
            try:
                notified = False
                if contact.phone and all(TWILIO_CONFIG.values()):
                    send_emergency_sms(
                        contact.phone,
                        user.name,
                        sos_alert.message,
                        **sos_alert_location_data
                    )
                    notified = True
                if contact.email and all([EMAIL_CONFIG['user'], EMAIL_CONFIG['password']]):
                    send_emergency_email(
                        contact.email,
                        user.name,
                        sos_alert.message,
                        **sos_alert_location_data
                    )
                    notified = True
                if notified:
                    notifications.append({'name': contact.name, 'type': contact.__class__.__name__.lower()})
            except Exception as e:
                errors.append(f"Failed to notify {contact.name}: {str(e)}")
                logger.error(f"Notification error for {contact.name}: {str(e)}")

        logger.info(f"SOS triggered for user {user.id}, notifications sent: {len(notifications)}")
        response = {
            'message': 'SOS triggered successfully',
            'alert_id': sos_alert.id,
            'notifications_sent': len(notifications),
            'location_shared': bool(sos_alert.latitude and sos_alert.longitude),
            'emergency_services': {'ambulance': '108', 'police': '100', 'fire': '101', 'women_helpline': '1091'}
        }
        if errors:
            response['notification_errors'] = errors
        return jsonify(response), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"SOS trigger error for user {user.id}: {str(e)}")
        return jsonify({'error': f'Error triggering SOS: {str(e)}'}), 500

# --- Period Tracker Endpoints ---
@app.route('/api/period-tracker/<int:user_id>/log', methods=['POST'])
def log_period(user_id):
    try:
        data = request.get_json()
        if not data or 'cycle_start_date' not in data:
            return jsonify({'error': 'Cycle start date is required'}), 400

        period_log = PeriodTracker(
            user_id=user_id,
            cycle_start_date=datetime.strptime(data['cycle_start_date'], '%Y-%m-%d').date(),
            cycle_length=data.get('cycle_length'),
            period_length=data.get('period_length'),
            flow_intensity=data.get('flow_intensity'),
            symptoms=data.get('symptoms'),
            mood=data.get('mood'),
            notes=data.get('notes')
        )
        db.session.add(period_log)
        db.session.commit()
        return jsonify({'message': 'Period logged successfully', 'log_id': period_log.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to log period for user {user_id}: {str(e)}")
        return jsonify({'error': f'Failed to log period: {str(e)}'}), 500

@app.route('/api/period-tracker/<int:user_id>/history', methods=['GET'])
def get_period_history(user_id):
    try:
        periods = db.session.query(PeriodTracker).filter_by(user_id=user_id).order_by(PeriodTracker.cycle_start_date.desc()).all()

        return jsonify({
            'periods': [{
                'id': p.id, 'cycle_start_date': p.cycle_start_date.isoformat(), 'cycle_length': p.cycle_length,
                'period_length': p.period_length, 'flow_intensity': p.flow_intensity, 'symptoms': p.symptoms,
                'mood': p.mood, 'notes': p.notes
            } for p in periods]
        }), 200
    except Exception as e:
        logger.error(f"Period history error for user {user_id}: {str(e)}")
        return jsonify({'error': f'Error fetching period history: {str(e)}'}), 500

# --- Maternity Suite Endpoints ---
@app.route('/api/maternity/<int:user_id>/start', methods=['POST'])
def start_pregnancy_tracking(user_id):
    """Starts tracking pregnancy for a user based on their last menstrual period."""
    try:
        data = request.get_json()
        if not data or 'lmp_date' not in data:
            return jsonify({'error': 'Last menstrual period date (lmp_date) is required'}), 400

        lmp_date = datetime.strptime(data['lmp_date'], '%Y-%m-%d').date()
        # A standard pregnancy is 280 days (40 weeks) from the LMP
        due_date = lmp_date + timedelta(days=280)

        # Deactivate any previous pregnancy logs for this user
        db.session.query(PregnancyTracker).filter_by(user_id=user_id).update({'is_active': False})

        pregnancy = PregnancyTracker(
            user_id=user_id,
            last_menstrual_period=lmp_date,
            due_date=due_date,
            is_active=True
        )
        db.session.add(pregnancy)
        db.session.commit()

        logger.info(f"Pregnancy tracking started for user {user_id}. Due date: {due_date.isoformat()}")
        return jsonify({
            'message': 'Pregnancy tracking started successfully',
            'pregnancy_id': pregnancy.id,
            'due_date': due_date.isoformat()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to start pregnancy tracking for user {user_id}: {str(e)}")
        return jsonify({'error': f'Failed to start tracking: {str(e)}'}), 500

@app.route('/api/maternity/<int:user_id>/dashboard', methods=['GET'])
def get_maternity_dashboard(user_id):
    """Gets the maternity dashboard for a user."""
    try:
        pregnancy = db.session.query(PregnancyTracker).filter_by(user_id=user_id, is_active=True).first()
        if not pregnancy:
            return jsonify({'error': 'No active pregnancy found for this user.'}), 404

        days_pregnant = (datetime.now(UTC).date() - pregnancy.last_menstrual_period).days
        current_week = (days_pregnant // 7) + 1
        days_remaining = (pregnancy.due_date - datetime.now(UTC).date()).days

        guide = db.session.query(MaternityGuide).filter_by(week=current_week).first()

        return jsonify({
            'due_date': pregnancy.due_date.isoformat(),
            'current_week': current_week,
            'days_pregnant': days_pregnant,
            'days_remaining': days_remaining,
            'trimester': (current_week - 1) // 13 + 1,
            'current_week_guide': {
                'title': guide.title,
                'baby_development': guide.baby_development,
                'mother_changes': guide.mother_changes,
                'tips': guide.tips,
                'image_url': guide.image_url
            } if guide else None
        }), 200

    except Exception as e:
        logger.error(f"Error fetching maternity dashboard for user {user_id}: {str(e)}")
        return jsonify({'error': f'Error fetching dashboard: {str(e)}'}), 500

@app.route('/api/maternity/guide/<int:week>', methods=['GET'])
def get_maternity_guide_for_week(week):
    """Gets the maternity guide for a specific week."""
    try:
        guide = db.session.query(MaternityGuide).filter_by(week=week).first()
        if not guide:
            return jsonify({'error': 'Guide for the specified week not found.'}), 404

        return jsonify({
            'week': guide.week,
            'title': guide.title,
            'baby_development': guide.baby_development,
            'mother_changes': guide.mother_changes,
            'tips': guide.tips,
            'image_url': guide.image_url
        }), 200

    except Exception as e:
        logger.error(f"Error fetching maternity guide for week {week}: {str(e)}")
        return jsonify({'error': f'Error fetching guide: {str(e)}'}), 500

@app.route('/api/maternity/<int:user_id>/symptoms', methods=['POST', 'GET'])
def manage_pregnancy_symptoms(user_id):
    """Log or retrieve pregnancy symptoms."""
    try:
        pregnancy = db.session.query(PregnancyTracker).filter_by(user_id=user_id, is_active=True).first()
        if not pregnancy:
            return jsonify({'error': 'No active pregnancy found for this user.'}), 404

        if request.method == 'POST':
            data = request.get_json()
            if not data or 'symptom_name' not in data:
                return jsonify({'error': 'symptom_name is a required field.'}), 400

            symptom = PregnancySymptom(
                pregnancy_id=pregnancy.id,
                symptom_name=data['symptom_name'],
                severity=data.get('severity'),
                notes=data.get('notes')
            )
            db.session.add(symptom)
            db.session.commit()
            return jsonify({'message': 'Symptom logged successfully', 'symptom_id': symptom.id}), 201

        if request.method == 'GET':
            symptoms = db.session.query(PregnancySymptom).filter_by(pregnancy_id=pregnancy.id).order_by(PregnancySymptom.log_date.desc()).all()
            return jsonify({
                'symptoms': [{
                    'id': s.id, 'symptom_name': s.symptom_name, 'severity': s.severity,
                    'notes': s.notes, 'log_date': s.log_date.isoformat()
                } for s in symptoms]
            }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error managing pregnancy symptoms for user {user_id}: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/maternity/<int:user_id>/kick-counter', methods=['POST', 'GET'])
def manage_kick_counter(user_id):
    """Log or retrieve kick counting sessions."""
    try:
        pregnancy = db.session.query(PregnancyTracker).filter_by(user_id=user_id, is_active=True).first()
        if not pregnancy:
            return jsonify({'error': 'No active pregnancy found for this user.'}), 404

        if request.method == 'POST':
            data = request.get_json()
            required_fields = ['start_time', 'end_time', 'kick_count']
            if not data or not all(key in data for key in required_fields):
                return jsonify({'error': f'Missing required fields: {required_fields}'}), 400

            start_time = datetime.fromisoformat(data['start_time'])
            end_time = datetime.fromisoformat(data['end_time'])
            duration = (end_time - start_time).total_seconds() / 60  # in minutes

            kick_session = KickCount(
                pregnancy_id=pregnancy.id,
                start_time=start_time,
                end_time=end_time,
                kick_count=data['kick_count'],
                duration_minutes=round(duration)
            )
            db.session.add(kick_session)
            db.session.commit()
            return jsonify({'message': 'Kick session logged successfully', 'session_id': kick_session.id}), 201

        if request.method == 'GET':
            sessions = db.session.query(KickCount).filter_by(pregnancy_id=pregnancy.id).order_by(KickCount.start_time.desc()).all()
            return jsonify({
                'sessions': [{
                    'id': s.id, 'start_time': s.start_time.isoformat(), 'end_time': s.end_time.isoformat(),
                    'kick_count': s.kick_count, 'duration_minutes': s.duration_minutes
                } for s in sessions]
            }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error with kick counter for user {user_id}: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/maternity/<int:user_id>/contraction-timer', methods=['POST', 'GET'])
def manage_contraction_timer(user_id):
    """Log or retrieve contractions."""
    try:
        pregnancy = db.session.query(PregnancyTracker).filter_by(user_id=user_id, is_active=True).first()
        if not pregnancy:
            return jsonify({'error': 'No active pregnancy found for this user.'}), 404

        if request.method == 'POST':
            data = request.get_json()
            if not data or 'duration_seconds' not in data:
                return jsonify({'error': 'duration_seconds is required'}), 400

            last_contraction = db.session.query(Contraction).filter_by(pregnancy_id=pregnancy.id).order_by(Contraction.start_time.desc()).first()
            frequency = None
            current_start_time = datetime.now(UTC)
            if last_contraction:
                frequency = (current_start_time - last_contraction.start_time).total_seconds() / 60  # in minutes

            contraction = Contraction(
                pregnancy_id=pregnancy.id,
                start_time=current_start_time,
                duration_seconds=data['duration_seconds'],
                frequency_minutes=round(frequency, 1) if frequency else None
            )
            db.session.add(contraction)
            db.session.commit()
            return jsonify({'message': 'Contraction logged successfully', 'contraction_id': contraction.id}), 201

        if request.method == 'GET':
            contractions = db.session.query(Contraction).filter_by(pregnancy_id=pregnancy.id).order_by(Contraction.start_time.desc()).limit(20).all()
            return jsonify({
                'contractions': [{
                    'id': c.id, 'start_time': c.start_time.isoformat(), 'duration_seconds': c.duration_seconds,
                    'frequency_minutes': c.frequency_minutes
                } for c in contractions]
            }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error with contraction timer for user {user_id}: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

# --- Community Forum Endpoints ---
@app.route('/api/community/posts', methods=['GET', 'POST', 'OPTIONS'])
def manage_community_posts():
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS request for /api/community/posts")
        return make_response('', 200)

    try:
        if request.method == 'GET':
            limit = request.args.get('limit', 20, type=int)
            category = request.args.get('category')
            query = db.session.query(CommunityPost)
            if category:
                query = query.filter_by(category=category)
            posts = query.order_by(CommunityPost.created_at.desc()).limit(limit).all()

            posts_data = [{
                'id': post.id, 'user_id': post.user_id, 'title': post.title, 'content': post.content,
                'category': post.category, 'created_at': post.created_at.isoformat(),
                'updated_at': post.updated_at.isoformat() if post.updated_at else None
            } for post in posts]

            logger.info(f"Fetched {len(posts_data)} community posts")
            return jsonify({'posts': posts_data, 'count': len(posts_data)}), 200

        if request.method == 'POST':
            data = request.get_json()
            if not data or not all(key in data for key in ['user_id', 'title', 'content']):
                logger.warning(f"Invalid community post data: {data}")
                return jsonify({'error': 'Missing required fields: user_id, title, content'}), 400

            user = db.session.get(User, data['user_id'])
            if not user:
                logger.warning(f"User not found for community post: ID {data['user_id']}")
                return jsonify({'error': 'User not found'}), 404

            post = CommunityPost(
                user_id=data['user_id'],
                title=data['title'],
                content=data['content'],
                category=data.get('category')
            )
            db.session.add(post)
            db.session.commit()

            socketio.emit('new_community_post', {
                'post_id': post.id, 'user_id': post.user_id, 'title': post.title,
                'category': post.category, 'created_at': post.created_at.isoformat()
            })

            logger.info(f"Community post created by user {data['user_id']}")
            return jsonify({
                'message': 'Post created successfully',
                'post_id': post.id
            }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Community post error: {str(e)}")
        return jsonify({'error': f'Error managing community post: {str(e)}'}), 500

@app.route('/api/community/posts/<int:post_id>/comments', methods=['GET', 'POST', 'OPTIONS'])
def manage_community_comments(post_id):
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS request for /api/community/posts/comments")
        return make_response('', 200)

    try:
        post = db.session.get(CommunityPost, post_id)
        if not post:
            logger.warning(f"Community post not found: ID {post_id}")
            return jsonify({'error': 'Post not found'}), 404

        if request.method == 'GET':
            comments = db.session.query(CommunityComment).filter_by(post_id=post_id).order_by(CommunityComment.created_at.asc()).all()
            comments_data = [{
                'id': comment.id, 'user_id': comment.user_id, 'content': comment.content,
                'created_at': comment.created_at.isoformat()
            } for comment in comments]

            logger.info(f"Fetched {len(comments_data)} comments for post {post_id}")
            return jsonify({'comments': comments_data, 'count': len(comments_data)}), 200

        if request.method == 'POST':
            data = request.get_json()
            if not data or not all(key in data for key in ['user_id', 'content']):
                logger.warning(f"Invalid comment data: {data}")
                return jsonify({'error': 'Missing required fields: user_id, content'}), 400

            user = db.session.get(User, data['user_id'])
            if not user:
                logger.warning(f"User not found for comment: ID {data['user_id']}")
                return jsonify({'error': 'User not found'}), 404

            comment = CommunityComment(
                post_id=post_id,
                user_id=data['user_id'],
                content=data['content']
            )
            db.session.add(comment)
            db.session.commit()

            socketio.emit('new_community_comment', {
                'post_id': post_id, 'comment_id': comment.id, 'user_id': comment.user_id,
                'content': comment.content, 'created_at': comment.created_at.isoformat()
            })

            logger.info(f"Comment added to post {post_id} by user {data['user_id']}")
            return jsonify({
                'message': 'Comment added successfully',
                'comment_id': comment.id
            }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Community comment error for post {post_id}: {str(e)}")
        return jsonify({'error': f'Error managing comment: {str(e)}'}), 500

# --- Additional Location Endpoints ---
@app.route('/api/location/<int:user_id>/history', methods=['GET'])
def get_location_history(user_id):
    try:
        limit = request.args.get('limit', 100, type=int)
        hours = request.args.get('hours', 24, type=int)
        high_accuracy_only = request.args.get('high_accuracy_only', 'false').lower() == 'true'

        query = db.session.query(LocationLog).filter_by(user_id=user_id).filter(
            LocationLog.timestamp >= datetime.now(UTC) - timedelta(hours=hours)
        )
        if high_accuracy_only:
            query = query.filter(LocationLog.is_high_accuracy == True)
        locations = query.order_by(LocationLog.timestamp.desc()).limit(limit).all()

        location_data = [{
            'id': loc.id, 'latitude': loc.latitude, 'longitude': loc.longitude, 'accuracy': loc.accuracy,
            'accuracy_description': get_accuracy_description(loc.accuracy), 'altitude': loc.altitude,
            'heading': loc.heading, 'speed': loc.speed, 'address': loc.address,
            'location_source': loc.location_source, 'timestamp': loc.timestamp.isoformat()
        } for loc in locations]

        logger.info(f"Location history fetched for user {user_id}: {len(location_data)} records")
        return jsonify({
            'locations': location_data,
            'count': len(location_data),
            'filters': {'hours': hours, 'limit': limit, 'high_accuracy_only': high_accuracy_only}
        }), 200
    except Exception as e:
        logger.error(f"Location history error for user {user_id}: {str(e)}")
        return jsonify({'error': f'Error fetching location history: {str(e)}'}), 500
        

# --- Error Handlers ---
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"404 error: {str(error)} - Requested URL: {request.url}")
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(error):
    logger.error(f"500 error: {str(error)} - Requested URL: {request.url}")
    return jsonify({'error': 'Internal server error'}), 500

# --- Main Execution ---
if __name__ == '__main__':
    try:
        # Initialize database with retry logic
        init_db()
        
        port = int(os.environ.get("PORT", 5000))
        logger.info(f"Starting Flask server with Socket.IO on port {port}")
        socketio.run(app, host='0.0.0.0', port=port, debug=False)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise

# Ensure database is initialized when app is imported
def ensure_db_initialized():
    """Ensure database is initialized when the app is imported"""
    try:
        with app.app_context():
            # Check if users table exists
            result = db.session.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')")
            table_exists = result.scalar()
            
            if not table_exists:
                logger.info("Users table not found, initializing database...")
                init_db()
            else:
                logger.info("Database tables already exist")
    except Exception as e:
        logger.warning(f"Database initialization check failed: {str(e)}")

# Run database initialization check
ensure_db_initialized()