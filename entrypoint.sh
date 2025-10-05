#!/bin/sh

# Start the cron service in the background
cron

# Start Gunicorn in the foreground
# The "exec" command is important to ensure Gunicorn receives signals correctly
exec gunicorn --bind 0.0.0.0:8000 groundwater_project.wsgi:application
