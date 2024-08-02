### BUILD CLIENT
FROM node:20.16.0-alpine3.20 AS client-builder

ARG env

# Create build directory
WORKDIR /usr/src/builder

# Copy client source
COPY --chown=node:node package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY --chown=node:node .yarn ./.yarn/
COPY --chown=node:node client ./client/
COPY --chown=node:node shared ./shared/

# Install dependencies and build client
RUN yarn \
  && yarn workspace konsti-client build:$env

### BUILD APP IMAGE
FROM node:20.16.0-alpine3.20 AS runner

# Install init process tool to avoid Node running PID 1
RUN apk --no-cache add dumb-init=1.2.5-r3

# Create app directory
WORKDIR /usr/src/app

# Copy server source
COPY --chown=node:node package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY --chown=node:node .yarn ./.yarn/
COPY --chown=node:node server ./server/
COPY --chown=node:node shared ./shared/

# Copy client
COPY --from=client-builder /usr/src/builder/client/build /usr/src/app/server/front

# Install dependencies
RUN yarn workspaces focus --all --production

# App binds to port 5000
EXPOSE 5000

# Set non-root user
USER node

# Command to run app
CMD ["dumb-init", "yarn", "start"]
