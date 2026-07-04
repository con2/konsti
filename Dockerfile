ARG NODE_IMAGE=node:24.18.0-alpine3.24

### BUILD CLIENT
FROM ${NODE_IMAGE} AS client-builder

ARG env
# Git SHA used as the Sentry release name
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Create build directory
WORKDIR /usr/src/builder

# Install dependencies first (cached unless package files change)
COPY --chown=node:node package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY --chown=node:node .yarn ./.yarn/
COPY --chown=node:node client/package.json ./client/
RUN yarn

# Copy source and build client. SENTRY_AUTH_TOKEN is mounted as a build secret
# so it never lands in an image layer; when present the Vite Sentry plugin
# uploads source maps and deletes them from the build. Absent (e.g. local
# builds) the plugin is skipped and the build proceeds normally
COPY --chown=node:node client ./client/
COPY --chown=node:node shared ./shared/
# vite.config.ts imports the port-offset resolver from scripts/
COPY --chown=node:node scripts ./scripts/
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || true)" \
    yarn workspace client build:$env

### BUILD APP IMAGE
FROM ${NODE_IMAGE} AS runner

# Git SHA reported as the Sentry release at runtime, matching the release created
# in deploy.yml so backend events are associated with it
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Install init process tool to avoid Node running PID 1
RUN apk --no-cache add dumb-init=1.2.5-r4

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (cached unless package files change)
COPY --chown=node:node package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY --chown=node:node .yarn ./.yarn/
COPY --chown=node:node server/package.json ./server/
RUN yarn workspaces focus --all --production

# Copy source
COPY --chown=node:node server ./server/
COPY --chown=node:node shared ./shared/

# Copy client
COPY --from=client-builder /usr/src/builder/client/build /usr/src/app/server/front

# App binds to port 5000
EXPOSE 5000

# Set non-root user
USER node

# Command to run app
CMD ["dumb-init", "yarn", "start"]
