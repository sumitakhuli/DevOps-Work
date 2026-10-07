# Slim official Python base image
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first, so this layer is cached separately from the code
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY app.py ./

EXPOSE 5000

CMD ["python", "app.py"]
