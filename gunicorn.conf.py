```python
import multiprocessing
import os

bind = f"0.0.0.0:{os.getenv('PORT', 8000)}"
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)  # Cap at 4 to avoid overloading Render
worker_class = "eventlet"
worker_connections = 1000
timeout = 30
keepalive = 2
loglevel = "info"

# Optional: Redirect logs to Render's logging system
accesslog = "-"
errorlog = "-"
```
