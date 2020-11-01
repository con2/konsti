FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn --only=production

# Copy app source
COPY . .

# App binds to port 5000
EXPOSE 5000

# Command to run app
CMD [ "yarn", "start" ]
