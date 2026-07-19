# syntax=docker/dockerfile:1

# ---- Build stage -------------------------------------------------------------
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Install dependencies first so this layer is cached when only source changes.
COPY package.json package-lock.json ./

# bcrypt ships prebuilt binaries for most platforms, but needs a toolchain if
# it has to compile from source.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && npm ci \
 && rm -rf /var/lib/apt/lists/*

COPY . .

# VITE_* variables are inlined at build time, so branding must be supplied
# here, not at runtime. Compose passes these through from .env.
ARG VITE_SITE_NAME
ARG VITE_SITE_TAGLINE
ARG VITE_PUBLIC_BASE_URL
ARG VITE_LOGO_URL
ARG VITE_CONTACT_EMAIL
ARG VITE_CONTACT_PHONE
ARG VITE_CURRENCY_SYMBOL
ARG VITE_CURRENCY_CODE
ARG VITE_COUNTRY_CODE
ARG VITE_COUNTRY_NAME
ARG VITE_BOOKING_MODE
ARG VITE_ENABLE_INVOICING
ARG VITE_ENABLE_DEPOSITS
ARG VITE_ENABLE_WHATSAPP

RUN npm run build

# Drop dev dependencies from the tree we copy forward.
RUN npm prune --omit=dev


# ---- Runtime stage -----------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Run as the built-in non-root user rather than root.
RUN mkdir -p /app/uploads && chown -R node:node /app

# The server bundle is built with --packages=external, so node_modules is
# required at runtime — it is not bundled in.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

# Needed by `npm run db:push` during first-time setup.
COPY --from=build --chown=node:node /app/shared ./shared
COPY --from=build --chown=node:node /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build --chown=node:node /app/migrations ./migrations

USER node

# Uploaded images live here. Mount a volume so they survive redeploys.
VOLUME ["/app/uploads"]
ENV UPLOAD_DIR=/app/uploads

EXPOSE 5000

# Reports unhealthy if the app stops answering, so the platform can restart it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/public/booking-mode').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
