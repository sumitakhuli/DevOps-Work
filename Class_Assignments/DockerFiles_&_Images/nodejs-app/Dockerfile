# ---------- Stage 1: build ----------
FROM node:20 AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY app.js ./
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# only the bundled output crosses the stage boundary
COPY --from=build /app/dist/app.js ./app.js
USER node
EXPOSE 3000
CMD ["node", "app.js"]
