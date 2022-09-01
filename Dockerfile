FROM node:18-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
COPY back/package.json ./
USER node

RUN npm install

COPY --chown=node:node . .
EXPOSE 3003

CMD [ "npm", "start" ]
