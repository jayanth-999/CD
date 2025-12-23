# ==========================================
# Dockerfile for Node.js Backend
# ==========================================

# 1. Base Image
# We start from a standard Node.js image. 'alpine' is a very small Linux distribution,
# making our final image smaller and faster to download.
FROM node:22-alpine

# 2. Working Directory
# This sets the folder inside the container where our app will live.
# All subsequent commands (COPY, RUN, CMD) happen here.
WORKDIR /app

# 3. Dependency Installation (Layer Caching Strategy)
# We copy ONLY package.json and package-lock.json (if it exists) first.
# Why? Docker caches each "layer" (line). If package.json hasn't changed,
# Docker will skip the 'npm install' step and use the cached version.
# This makes re-builds super fast when you only change code, not dependencies.
COPY package*.json ./

# Install dependencies defined in package.json
RUN npm install

# 4. Copy Source Code
# Now we copy the rest of our application code.
# Since this is after 'npm install', changing a code file won't trigger a re-install.
COPY . .

# 5. Expose Port
# This documents that the container listens on port 3000.
# It doesn't actually publish the port (docker-compose does that), but it's good practice.
EXPOSE 3000

# 6. Start Command
# The command to run when the container starts.
CMD ["npm", "start"]
