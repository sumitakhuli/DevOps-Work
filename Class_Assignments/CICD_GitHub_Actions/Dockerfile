FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ app/

# run as a non-root user
RUN useradd --create-home appuser
USER appuser

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app.main:app"]
