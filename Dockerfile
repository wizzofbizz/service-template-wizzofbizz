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

# Deliberately NOT pruning dev dependencies.
#
# DEPLOY.md tells the operator to run `npm run db:push` and `npm run db:seed`
# inside this container for first-time setup, and those need drizzle-kit and
# tsx — both dev dependencies. Pruning them produces an image that boots fine
# but cannot create its own schema, which is a confusing failure to hit on a
# fresh deploy.
#
# The cost is a larger image. The alternative (a separate migration image, or
# moving those two to dependencies) is worth revisiting if image size becomes
# a problem, but correctness of the documented setup path matters more here.


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

# Needed by the first-time setup commands in DEPLOY.md:
#   npm run db:push  -> drizzle.config.ts + shared/schema.ts
#   npm run db:seed  -> server/seed.ts, run through tsx
# server/ is the source, not the bundle — dist/ is what actually serves
# traffic, but seeding executes the TypeScript directly.
COPY --from=build --chown=node:node /app/shared ./shared
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
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
