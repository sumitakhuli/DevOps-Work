FROM python:3.12-slim

WORKDIR /app

# pick up Debian security fixes released after the base image was built
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# never run the app as root inside the container
RUN useradd --create-home --uid 10001 appuser
USER 10001

EXPOSE 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "app.app:app"]
