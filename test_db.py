#!/usr/bin/env python3
"""
Test script for database initialization
"""

import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_database_connection():
    """Test database connection without initializing the app"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        logger.error("DATABASE_URL not set")
        return False
    
    logger.info(f"Database URL: {database_url[:20]}...")  # Show first 20 chars for security
    
    try:
        # Import SQLAlchemy and test connection
        from sqlalchemy import create_engine, text
        
        # Convert old-style postgres URLs to SQLAlchemy-compatible
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection test successful")
            return True
            
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        return False

def main():
    """Main test function"""
    logger.info("Testing database connection...")
    
    if test_database_connection():
        logger.info("✅ Database connection test passed")
        logger.info("You can now run: python init_db.py")
    else:
        logger.error("❌ Database connection test failed")
        logger.info("Please check your DATABASE_URL environment variable")
        sys.exit(1)

if __name__ == "__main__":
    main()
