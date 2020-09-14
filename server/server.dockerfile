FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# App binds to port 3000
EXPOSE 3000

# Command to run app
CMD [ "npm", "run", "start" ]
