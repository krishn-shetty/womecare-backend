# WomeCare Deployment Guide

## Database Initialization Issue

The error `relation "users" does not exist` occurs because the database tables haven't been created yet. This is a common issue when deploying Flask applications with SQLAlchemy.

## Immediate Solution

To fix the current deployment issue:

1. **In Railway Console**: Run the database initialization script
   ```bash
   python init_db.py
   ```

2. **Or manually run migrations**:
   ```bash
   export FLASK_APP=app.py
   flask db upgrade
   ```

3. **Restart the application** after database initialization

## Solutions

### 1. Automatic Fix (Recommended)

The application has been updated with automatic database initialization:

- **startup.py**: Runs before the application starts to initialize the database
- **Updated Procfile**: Now runs the startup script before starting the app
- **app.py**: Includes automatic database initialization check

### 2. Manual Database Initialization

If you need to manually initialize the database:

```bash
# Run the database initialization script
python init_db.py
```

### 3. Using Flask-Migrate Commands

If you prefer to use Flask-Migrate directly:

```bash
# Set the Flask app environment variable
export FLASK_APP=app.py

# Run migrations
flask db upgrade
```

## Deployment Steps

### For Railway Deployment

1. The updated `Procfile` will automatically run database initialization
2. If issues persist, you can manually run the initialization script in Railway's console

### For Local Development

```bash
# Option 1: Use the deployment script
./deploy.sh

# Option 2: Manual steps
python init_db.py
python app.py
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure your `DATABASE_URL` environment variable is set correctly
2. **Permission Errors**: Make sure the application has write permissions to the database
3. **Migration Conflicts**: If migrations fail, the app will fall back to direct table creation

### Logs to Check

- Application logs will show database initialization progress
- Look for messages like "Database tables created successfully" or "Database migrations completed"

### Environment Variables

Ensure these environment variables are set:

- `DATABASE_URL`: Your PostgreSQL connection string
- `SECRET_KEY`: A secret key for JWT tokens
- Other service-specific variables (Twilio, Email, etc.)

## Database Schema

The application creates the following tables:

- `users`: User accounts and profiles
- `emergency_contact`: Emergency contact information
- `guardian`: Guardian information
- `location_log`: Location tracking data
- `medication_reminder`: Medication reminders
- `period_tracker`: Period tracking data
- `sos_alert`: Emergency alerts
- `pregnancy_tracker`: Pregnancy tracking
- `maternity_guide`: Pregnancy week-by-week guide
- `community_post`: Community forum posts
- `community_comment`: Community forum comments

## Support

If you continue to experience issues:

1. Check the application logs for detailed error messages
2. Verify your database connection string
3. Ensure all required environment variables are set
4. Try running the manual initialization script
