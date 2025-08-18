import os

bind = f"0.0.0.0:{os.getenv('PORT', 8000)}"
workers = 1
worker_class = "gevent"  # Switch to gevent
worker_connections = 1000
timeout = 30
keepalive = 5
loglevel = "debug"  # Set to debug for better error tracing
accesslog = "-"
errorlog = "-"
