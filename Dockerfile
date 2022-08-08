# STAGE 1
FROM node:latest as builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm config set unsafe-perm true
RUN node --version
RUN npm --version
RUN npm install -g npm@8.16.0
RUN npm install -g typescript
RUN npm install -g ts-node
USER node
RUN npm install
COPY --chown=node:node . .
RUN npm run build

# STAGE 2
FROM node:latest
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
# RUN npm install --save-dev sequelize-cli
RUN node --version
RUN npm --version
# RUN npm install -g npm@8.16.0
RUN npm install --production
COPY --from=builder /home/node/app/dist ./dist

COPY --chown=node:node .env .
COPY --chown=node:node  /keys ./keys
# COPY --chown=node:node  /public ./public

EXPOSE 4040
CMD [ "node", "dist/server.js" ]