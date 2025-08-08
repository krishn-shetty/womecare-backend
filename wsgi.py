# wsgi.py
import gevent
from gevent import monkey
monkey.patch_all()  # Apply monkey-patching first

# Import app and socketio after patching
from app import app, socketio
