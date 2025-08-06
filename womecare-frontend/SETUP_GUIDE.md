# Womecare Backend Setup Guide

## 🚀 Quick Start

### 1. Clone and Setup Environment

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd womecare-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
\`\`\`

### 2. Environment Configuration

\`\`\`bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual credentials
nano .env  # or use your preferred editor
\`\`\`

## 🔧 Service Configuration

### Twilio SMS Setup

1. **Create Twilio Account**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Sign up for a free account
   - Get $15 free credit for testing

2. **Get Credentials**
   \`\`\`
   Account SID: Found on your Twilio Console Dashboard
   Auth Token: Found on your Twilio Console Dashboard
   Phone Number: Purchase a phone number or use trial number
   \`\`\`

3. **Update .env**
   \`\`\`env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   \`\`\`

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Enable 2FA for your Gmail account

2. **Generate App Password**
   - Go to Google Account > Security > App passwords
   - Generate password for "Mail"
   - Use this password (not your regular Gmail password)

3. **Update .env**
   \`\`\`env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   \`\`\`

### Google Maps API Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing

2. **Enable APIs**
   - Enable "Geocoding API"
   - Enable "Maps JavaScript API"

3. **Create API Key**
   - Go to Credentials > Create Credentials > API Key
   - Restrict the key to your APIs and domains

4. **Update .env**
   \`\`\`env
   MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   \`\`\`

### Database Setup

#### SQLite (Development)
\`\`\`env
SQLALCHEMY_DATABASE_URI=sqlite:///womecare.db
\`\`\`

#### PostgreSQL (Production)
\`\`\`bash
# Install PostgreSQL
# Create database
createdb womecare_db

# Update .env
SQLALCHEMY_DATABASE_URI=postgresql://username:password@localhost:5432/womecare_db
\`\`\`

## 🏃‍♀️ Running the Application

\`\`\`bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run the application
python app.py
\`\`\`

The server will start on `http://localhost:5001`

## 🧪 Testing the Setup

### Test API Endpoints

\`\`\`bash
# Test basic endpoint
curl http://localhost:5001/

# Test user creation
curl -X POST http://localhost:5001/api/users \
-H "Content-Type: application/json" \
-d '{"name":"Test User","email":"test@example.com","phone":"+1234567890"}'
\`\`\`

### Test SMS (Optional)
\`\`\`bash
# Test SOS alert (replace user_id with actual ID)
curl -X POST http://localhost:5001/api/sos/1 \
-H "Content-Type: application/json" \
-d '{"message":"Test emergency","latitude":37.7749,"longitude":-122.4194}'
\`\`\`

## 📦 Dependencies

The `requirements.txt` includes all necessary packages:

- **Flask**: Web framework
- **Flask-SQLAlchemy**: Database ORM
- **Flask-CORS**: Cross-origin resource sharing
- **Flask-SocketIO**: Real-time communication
- **python-dotenv**: Environment variable management
- **PyJWT**: JSON Web Token authentication
- **twilio**: SMS notifications
- **folium**: Map generation
- **geopy**: Geocoding services
- **requests**: HTTP client
- **eventlet**: Async server support

## 🔒 Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Use strong JWT_SECRET_KEY
- [ ] Enable HTTPS in production
- [ ] Restrict CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Regular security updates

## 🚀 Production Deployment

### Environment Variables for Production
\`\`\`env
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-super-secure-production-key
SQLALCHEMY_DATABASE_URI=postgresql://user:pass@host:port/db
SESSION_COOKIE_SECURE=True
\`\`\`

### Recommended Production Setup
- Use PostgreSQL or MySQL
- Deploy on Heroku, AWS, or DigitalOcean
- Use Redis for caching
- Set up SSL certificates
- Configure monitoring and logging

## 🆘 Troubleshooting

### Common Issues

1. **Import Errors**
   \`\`\`bash
   pip install --upgrade pip
   pip install -r requirements.txt
   \`\`\`

2. **Database Errors**
   \`\`\`bash
   # Delete and recreate database
   rm womecare.db
   python app.py
   \`\`\`

3. **CORS Errors**
   - Check FRONTEND_URL in .env
   - Verify CORS configuration in app.py

4. **SMS Not Sending**
   - Verify Twilio credentials
   - Check phone number format (+1234567890)
   - Ensure sufficient Twilio balance

5. **Email Not Sending**
   - Use App Password for Gmail
   - Check firewall/antivirus blocking SMTP
   - Verify SMTP settings

## 📞 Support

For issues and questions:
- Check the logs in console output
- Review Flask debug output
- Test individual API endpoints
- Verify all environment variables are set

## 🔄 Updates

Keep your dependencies updated:
\`\`\`bash
pip list --outdated
pip install --upgrade package-name
\`\`\`

Regular security updates are recommended for production deployments.

## 📋 API Endpoints Summary

### User Management
- `POST /api/users` - Create user
- `POST /api/login` - User login
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile

### Emergency Features
- `POST /api/sos/{user_id}` - Trigger SOS alert
- `GET/POST /api/emergency-contacts/{user_id}` - Manage emergency contacts
- `DELETE /api/emergency-contacts/{user_id}/{contact_id}` - Delete contact

### Location Tracking
- `POST /api/location/{user_id}/live` - Update live location
- `GET /api/location/{user_id}/history` - Get location history
- `GET /api/location/{user_id}/route` - Get location route

### Health Tracking
- `POST /api/period-tracker/{user_id}/log` - Log period
- `GET /api/period-tracker/{user_id}/history` - Get period history
- `GET /api/period-tracker/{user_id}/predict` - Predict next period

### Maternity Features
- `POST /api/maternity/{user_id}/start` - Start pregnancy tracking
- `GET /api/maternity/{user_id}/dashboard` - Get maternity dashboard
- `POST/GET /api/maternity/{user_id}/symptoms` - Manage pregnancy symptoms
- `POST/GET /api/maternity/{user_id}/kick-counter` - Manage kick counting
- `POST/GET /api/maternity/{user_id}/contraction-timer` - Manage contractions

### Community Forum
- `GET/POST /api/community/posts` - Manage community posts
- `GET/POST /api/community/posts/{post_id}/comments` - Manage comments

### Dashboard
- `GET /api/dashboard/{user_id}` - Get user dashboard with all data

All endpoints support proper error handling, logging, and real-time updates via Socket.IO where applicable.
\`\`\`
