# ==========================================
# Dockerfile for React Frontend (Multi-Stage Build)
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
# We use a Node image to build our React application.
# We name this stage 'build' so we can refer to it later.
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
# FIX: Copy ONLY package.json (ignore package-lock.json)
# The Windows lockfile is missing Linux binaries (rollup-linux), causing the build to fail.
COPY package.json ./
RUN npm install

# Copy source code and build
COPY . .
# This runs 'vite build', creating a 'dist' folder with static HTML/JS/CSS
RUN npm run build


# ------------------------------------------
# Stage 2: Production Stage
# ------------------------------------------
# Now we switch to a lightweight Nginx image.
# We don't need Node.js anymore, just a web server to serve static files.
FROM nginx:alpine

# Copy the build output from the 'build' stage to Nginx's html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to proxy /api to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard web port)
EXPOSE 80

# Start Nginx (default command for this image, but good to know)
CMD ["nginx", "-g", "daemon off;"]

