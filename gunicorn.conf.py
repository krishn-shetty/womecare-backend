import os

bind = f"0.0.0.0:{os.getenv('PORT', 8000)}"
workers = 2  # Fixed to 2 for resource efficiency on Render
worker_class = "eventlet"
worker_connections = 1000
timeout = 30
keepalive = 2
loglevel = "info"

# Redirect logs to Render's logging system
accesslog = "-"
errorlog = "-"
