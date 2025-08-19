#!/usr/bin/env python3
"""
Simple script to create database tables
Run this in Railway console if automatic initialization fails
"""

import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Create database tables"""
    try:
        # Import after setting up logging
        from app import app, db
        
        logger.info("Creating database tables...")
        
        with app.app_context():
            # Create all tables
            db.create_all()
            logger.info("✅ Database tables created successfully!")
            
            # Test if users table exists
            from sqlalchemy import text
            result = db.session.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            logger.info(f"✅ Users table exists with {count} records")
            
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
