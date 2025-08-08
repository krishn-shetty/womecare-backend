# wsgi.py
import eventlet
eventlet.monkey_patch()

from app import app, socketio

# This file is used by Gunicorn to start the application.
