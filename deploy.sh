#!/bin/bash

# WomeCare Deployment Script
# This script handles database initialization and application deployment

set -e  # Exit on any error

echo "🚀 Starting WomeCare deployment..."

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "⚠️  Warning: Not in a virtual environment"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python init_db.py

# Start the application
echo "🌐 Starting application..."
python app.py
