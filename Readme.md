
# RKurento API

RKurento API is a Kurento Media Server controller, act as middleman between clients and Kurento Media Server. It consist of Room Management Utility, which assigns an unique 5 character long code for each room created by host. 


## Features

- Session Management
- Room Management 
  - Create Room
  - Join Room
  - Leave Room
- Stats
  - CPU Utilization of KMS

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`KMSURI` : Websocket URL of the Kurento Media Server . eg: "ws://<ipadresse>:8888/kurento"


## Usage/Examples  

```javascript

// Connect client to RKurento API Server using Websocket
let ws = new WebSocket("ws://127.0.0.0:4040/rkapi");

// Ping to check if server available
let message = {
  id: 'ping',
}
sendMessage(message);

// Create new Room
let message = {
  id: 'createRoom',
  sdpOffer: offer.sdp
}
sendMessage(message);

// Join room
let message = {
  id: 'joinRoom',
  roomId: roomId, // Room ID [string]
  sdpOffer: offer.sdp
};
sendMessage(message);

```


## Deployment

To deploy this project run

```bash
  npm install
  npm build
  npm start
```
Available NPM definitions:

    "build": "rimraf dist && tsc",
    "preserve": "npm run build",
    "dev": "cross-env NODE_ENV=development concurrently \"tsc --watch\" \"nodemon -q dist/server.js\"",
    "prestart": "npm run build",
    "start": "cross-env NODE_ENV=production node dist/server.js",
    "testAll": "mocha -r ts-node/register ./lib/**/tests/*.test.ts",
    "test": "mocha -r ts-node/register ./lib/**/tests/rkurento-api.test.ts",
    "coverage": "nyc -r text -e .ts -x \"./lib/**/tests/*.test.ts\" npm run test"

