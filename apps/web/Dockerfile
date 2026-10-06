# apps/web/Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies based on package lockfile
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm install

# Copy web app source files
COPY apps/web ./apps/web

WORKDIR /app/apps/web

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev"]
