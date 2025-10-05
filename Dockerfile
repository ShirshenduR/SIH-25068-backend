# Use a Python image that includes a package manager
FROM python:3.9-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies, including cron
RUN apt-get update && apt-get install -y cron

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . /app/

# Set up the cron job
COPY crontab.txt /etc/cron.d/update-data-cron
RUN chmod 0644 /etc/cron.d/update-data-cron
RUN crontab /etc/cron.d/update-data-cron

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the port the app runs on
EXPOSE 8000

# Set the entrypoint to our custom script
ENTRYPOINT ["/app/entrypoint.sh"]

# The default command to run (will be executed by the entrypoint)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "groundwater_project.wsgi:application"]
