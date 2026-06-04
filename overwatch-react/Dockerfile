# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Build runtime image
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies and production server
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt gunicorn

# Copy backend and frontend build output
COPY server ./server
COPY --from=frontend-builder /app/dist ./dist

WORKDIR /app/server
ENV DATABASE_PATH=/app/server/overwatch.db
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
