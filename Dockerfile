# Build dependencies
FROM node:latest as dependencies
WORKDIR /app
COPY package.json .
RUN npm --version
RUN npm install
COPY . . 
# Build production image
FROM dependencies as builder
RUN npm run build
EXPOSE 3000
CMD npm run start