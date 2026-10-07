# Small official Node base image
FROM node:20-alpine

# All following commands run inside this directory in the image
WORKDIR /app

# Copy dependency manifest first so this layer is cached
# and is only rebuilt when package.json actually changes
COPY package.json ./

# No third-party dependencies here, but this is where they would install
RUN npm install --omit=dev

# Now copy the application source
COPY app.js ./

# Document which port the app listens on
EXPOSE 3000

# The process that runs when the container starts
CMD ["node", "app.js"]
