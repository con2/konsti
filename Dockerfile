FROM node:14-alpine3.13

# Create app directory
WORKDIR /usr/src/app

# Copy app source
COPY . .

# Install dependencies
RUN yarn --production --frozen-lockfile

# App binds to port 5000
EXPOSE 5000

# Command to run app
CMD ["yarn", "start-and-populate-db"]
