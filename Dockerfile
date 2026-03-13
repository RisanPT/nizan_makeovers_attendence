FROM node:20-slim

# Only build-essential and python3 needed for @tensorflow/tfjs-node native binding
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

EXPOSE 8000

CMD ["node", "server.js"]
