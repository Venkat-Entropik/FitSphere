# FitSphere backend. Build from this folder:  docker build -t fitsphere-backend backend
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

# Install everything (tsx runs the TypeScript directly, so there is no separate build step).
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Listen on all interfaces. The platform sets PORT. Data lives on a mounted volume at /data.
ENV HOST=0.0.0.0 \
    DATABASE_PATH=/data/fitsphere.db
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Runs as root so the platform's volume is writable; the container has no shell access for users.
CMD ["npm", "run", "start:prod"]
