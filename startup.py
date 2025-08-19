#!/usr/bin/env python3
"""
Startup script for WomeCare application
Handles database initialization and migrations before starting the Flask app
"""

import os
import sys
import time
import logging
from flask_migrate import upgrade
from app import app, db, init_db

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_migrations():
    """Run database migrations using Flask-Migrate"""
    try:
        logger.info("Running database migrations...")
        with app.app_context():
            upgrade()
        logger.info("Database migrations completed successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to run migrations: {str(e)}")
        return False

def create_tables_directly():
    """Create tables directly using SQLAlchemy create_all()"""
    try:
        logger.info("Creating tables directly...")
        with app.app_context():
            db.create_all()
        logger.info("Tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to create tables directly: {str(e)}")
        return False

def initialize_database():
    """Initialize database with tables and sample data"""
    try:
        logger.info("Initializing database...")
        success = init_db()
        if success:
            logger.info("Database initialization completed successfully")
            return True
        else:
            logger.error("Database initialization failed")
            return False
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        return False

def main():
    """Main startup function"""
    logger.info("Starting WomeCare application initialization...")
    
    # Wait for database to be ready (useful for containerized environments)
    max_retries = 30
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Testing database connection (attempt {attempt + 1}/{max_retries})...")
            with app.app_context():
                db.session.execute("SELECT 1")
            logger.info("Database connection successful")
            break
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error("Failed to connect to database after all retries")
                sys.exit(1)
    
    # Try to run migrations first
    migration_success = run_migrations()
    
    if not migration_success:
        logger.warning("Migrations failed, trying direct table creation...")
        table_creation_success = create_tables_directly()
        
        if table_creation_success:
            logger.info("Tables created successfully, now populating sample data...")
            init_success = initialize_database()
            if not init_success:
                logger.warning("Sample data population failed, but tables are created")
        else:
            logger.error("Both migrations and direct table creation failed")
            sys.exit(1)
    
    logger.info("Database setup completed successfully")
    logger.info("Application is ready to start")

if __name__ == "__main__":
    main()
