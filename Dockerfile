FROM node:alpine3.13

# Create app directory
WORKDIR /usr/src/app

# Copy Yarn
COPY .yarnrc .
COPY .yarn ./.yarn

# Copy dependency files
COPY package.json .
COPY yarn.lock .

# Install dependencies
RUN yarn --production

# Copy app source
COPY . .

# App binds to port 5000
EXPOSE 5000

# Command to run app
CMD ["yarn", "start-and-populate-db"]
