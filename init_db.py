#!/usr/bin/env python3
"""
Database initialization script for WomeCare application
Can be run manually to set up the database
"""

import os
import sys
import logging
from flask_migrate import upgrade
from app import app, db, init_db

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Initialize the database"""
    logger.info("Starting database initialization...")
    
    # Check if DATABASE_URL is set
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable is not set")
        logger.info("Please set DATABASE_URL to your database connection string")
        logger.info("For local development, you can use: sqlite:///womecare.db")
        sys.exit(1)
    
    try:
        with app.app_context():
            # Test database connection
            logger.info("Testing database connection...")
            db.session.execute("SELECT 1")
            logger.info("Database connection successful")
            
            # Try to run migrations first
            try:
                logger.info("Running database migrations...")
                upgrade()
                logger.info("Database migrations completed successfully")
            except Exception as e:
                logger.warning(f"Migrations failed: {str(e)}")
                logger.info("Trying direct database initialization...")
                
                # If migrations fail, try direct initialization
                success = init_db()
                if not success:
                    logger.error("Database initialization failed")
                    sys.exit(1)
            
            logger.info("Database initialization completed successfully!")
            
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
