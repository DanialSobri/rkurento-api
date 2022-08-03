import express, { Express, Request, response, Response } from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import ip from 'ip';

// RKurentoAPI
import {
    getSessions
} from './RKurentoAPI/rkurento-api'
import {
    createRoom,
    joinRoom,
    leaveRoom,
    onIceCandidate
} from './RKurentoAPI/rkurento-api';
import {
    RoomsManager
} from './RKurentoAPI/rk-room';

const options =
{
    key: process.env.KEY || readFileSync('keys/server.key'),
    cert: process.env.CRT || readFileSync('keys/server.crt')
}
const WSPORT = process.env.WSPORT || 4040;
const KMSURI = process.env.KMSURI || "ws://167.99.255.24:8888/kurento";

export default function (app: Express, sessionHandler: express.RequestHandler) {

    const server = createServer(app).listen(WSPORT, () => {
        console.log(`Running Websocket on ws://${ip.address()}:${WSPORT}/rkapi ⚡`);
    })
    const wss = new WebSocketServer({
        server: server,
        maxPayload: 128 * 1024, // 128 KB
        path: '/rkapi'
    })

    /*
    * Management of WebSocket messages
    */
    wss.on('connection', function (ws, request: Request) {
        let sessionId: string = "";
        let websocketId: any = null; // differ tabs
        const req = request;
        let res: Response = response.writeHead(200, {});
        // Apply session handling
        sessionHandler(req, res, function () {
            sessionId = req.session.id
            console.log('Connection received with sessionId ' + sessionId)
            websocketId = req.headers['sec-websocket-key']
        })

        ws.on('error', function (error) {
            console.log('Connection ' + sessionId + ' error');
            // stop(sessionId, websocketId)
        })

        ws.on('close', function () {
            console.log('Connection ' + sessionId + ' , ' + websocketId + ' closed');
            // stop(sessionId, websocketId)
        })

        ws.on('message', async function (_message: string) {
            const message = JSON.parse(_message)
            console.log('Connection ' + sessionId + ' received message ' + message.id);

            switch (message.id) {
                case 'ping':

                    ws.send(JSON.stringify({
                        id: 'pong',
                        message: 'from RK API Server for client with ' + sessionId
                    }))
                    break

                case 'stats':
                    const availableRoom = RoomsManager.getSingleton().getAllSessions()
                    const sessions = await getSessions(KMSURI)
                    console.log(sessions)
                    console.info("Num of Sessions: ", sessions?.length)
                    ws.send(JSON.stringify({
                        id: 'serverStats',
                        message: ' Rooms:' + JSON.stringify(availableRoom)
                    }))
                    break

                case 'createRoom':
                    sessionId = request.session.id;
                    websocketId = request.headers['sec-websocket-key'];
                    let roomId; let sdpAnswer;
                    [roomId, sdpAnswer] = await createRoom(KMSURI, websocketId, ws, message.sdpOffer)
                    if (!roomId) {
                        return ws.send(JSON.stringify({
                            id: 'error',
                            message: 'Error creating room'
                        }));
                    }
                    ws.send(JSON.stringify({
                        id: 'createdRoom',
                        roomId: roomId,
                        sdpAnswer: sdpAnswer
                    }));
                    console.log("Room ", JSON.stringify(RoomsManager.getSingleton().getRoom(roomId), null, 2))
                    break;

                case 'joinRoom':
                    sessionId = request.session.id;
                    websocketId = request.headers['sec-websocket-key'];
                    let joinroomId; let joinsdpAnswer;
                    [joinroomId, joinsdpAnswer] = await joinRoom(websocketId, message.roomId, ws, message.sdpOffer);
                    if (!joinroomId || !joinsdpAnswer) {
                        return ws.send(JSON.stringify({
                            id: 'error',
                            message: 'Error joining room'
                        }));
                    }
                    ws.send(JSON.stringify({
                        id: 'joinedRoom',
                        roomId: joinroomId,
                        sdpAnswer: joinsdpAnswer
                    }));
                    console.log("Room ", JSON.stringify(RoomsManager.getSingleton().getRoom(joinroomId), null, 2))
                    break;

                case 'leaveRoom':
                    sessionId = request.session.id;
                    websocketId = request.headers['sec-websocket-key'];
                    if (await leaveRoom(websocketId, message.roomId)) {
                        ws.send(JSON.stringify({
                            id: 'error',
                            message: "Error at LeaveRoom"
                        }));
                    }
                    else {
                        ws.send(JSON.stringify({
                            id: 'leftRoom',
                        }));
                    }
                    break;

                case 'onIceCandidate':
                    console.log("Register collected Ice for sessionId: ", sessionId, " , ws: ", websocketId)
                    onIceCandidate(message.roomId, websocketId, message.candidate);
                    break;

                default:
                    ws.send(JSON.stringify({
                        id: 'error',
                        message: 'Invalid message ' + message
                    }))
                    break
            }
        })
    })
}