FROM node:18.13.0-alpine3.17

# Create app directory
WORKDIR /usr/src/app

# Copy app source
COPY . .

# Install dependencies
RUN yarn workspaces focus --all --production

# App binds to port 5000
EXPOSE 5000

# Command to run app
CMD ["yarn", "start"]
