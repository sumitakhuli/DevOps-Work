# =========================================================
#  Stage 1: BUILD
#  Full Node image. Installs devDependencies (esbuild) and
#  bundles the app into a single minified file in /app/dist.
#  Everything heavy stays in this stage.
# =========================================================
FROM node:20 AS build

WORKDIR /app

# Copy the manifest first so this layer caches independently of the source
COPY package.json ./

# devDependencies are needed to BUILD, but must not ship to production
RUN npm install

# Copy source and produce the bundle
COPY server.js ./
RUN npm run build

# Show what the build stage produced (visible in the build log)
RUN echo "--- build stage output ---" && ls -lh /app/dist


# =========================================================
#  Stage 2: PRODUCTION
#  Small Alpine runtime. Copies ONLY the built bundle from
#  stage 1. No npm install, no node_modules, no esbuild.
# =========================================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# The one line that makes this a multi-stage build:
# pull an artifact out of the previous stage by name.
COPY --from=build /app/dist/server.js ./server.js

# Run as a non-root user, which the alpine image already provides
USER node

# The app listens on 8080 as required by the task
EXPOSE 8080

CMD ["node", "server.js"]
