import eventlet
eventlet.monkey_patch()

bind = f"0.0.0.0:{int(os.environ.get('PORT', 10000))}"
workers = 1
worker_class = "eventlet"
timeout = 30
keepalive = 2
loglevel = "info"
