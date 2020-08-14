FROM node:12.18.3

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle source app
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
