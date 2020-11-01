FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn --production

# Copy app source
COPY . .

# App binds to port 5000
EXPOSE 5000

# Populate MongoDB
# RUN yarn run generate-data -ugs

# Command to run app
CMD ["yarn", "start"]
