# ---------- Stage 1: build the dependency wheels ----------
FROM python:3.12 AS build
WORKDIR /app
COPY requirements.txt ./
# compile dependencies to .whl files; build toolchain stays in this stage
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ---------- Stage 2: slim runtime ----------
FROM python:3.12-slim
WORKDIR /app
# install from the prebuilt wheels, no compiler needed here
COPY --from=build /wheels /wheels
COPY requirements.txt ./
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels
COPY app.py ./
ENV PORT=5000
EXPOSE 5000
# gunicorn is the production WSGI server, rather than Flask's dev server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
