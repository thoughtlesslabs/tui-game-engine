FROM oven/bun:1.1-slim

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json tsconfig.json ./
COPY scripts/ ./scripts/
RUN bun install --production

# Patch ssh2 to disable curve25519 key exchange on Bun Linux arm64
RUN sed -i 's/const curve25519Supported =/const curve25519Supported = false; const _unused =/g' node_modules/ssh2/lib/protocol/constants.js

# Copy source code files and example
COPY src/ ./src/
COPY example/ ./example/

# Expose game ports
EXPOSE 2222 2223 3000

# Set default env variables (can be overridden by docker-compose)
ENV CONFIG_PATH=/app/data/config.json
ENV HOST_KEY_PATH=/app/data/host_key
ENV ADMIN_HOST_KEY_PATH=/app/data/admin_host_key

# Run the example game by default
CMD ["bun", "run", "example/index.ts"]
