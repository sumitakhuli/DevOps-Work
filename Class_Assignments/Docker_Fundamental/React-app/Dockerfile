# ---------------------------------------------------------
# Stage 1: build the React app with Node
# ---------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for layer caching
COPY package.json ./
RUN npm install

# Copy the source and produce the static bundle in /app/dist
COPY vite.config.js index.html ./
COPY src ./src
RUN npm run build

# ---------------------------------------------------------
# Stage 2: serve the built static files with Nginx
# ---------------------------------------------------------
FROM nginx:alpine

# Take ONLY the build output from stage 1.
# Node, npm and node_modules are all left behind, so the
# final image is small.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
