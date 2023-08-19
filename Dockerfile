FROM node:18.17.1-alpine3.17

# Install init process tool to avoid Node running PID 1
RUN apk --no-cache add dumb-init=1.2.5-r3

# Create app directory
WORKDIR /usr/src/app

# Copy app source
COPY --chown=node:node . .

# Install dependencies
RUN yarn workspaces focus --all --production

# App binds to port 5000
EXPOSE 5000

# Set non-root user
USER node

# Command to run app
CMD ["dumb-init", "yarn", "start"]
