#use node 18 image with alpine linux as base image
FROM node:18-alpine

#define working directory
WORKDIR /usr/src/app

#copy package.json from cache untill there is a change
COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD [ "node", "src/server.js" ]