import express, { Express, Request, response, Response } from 'express';
import { WebSocketServer } from 'ws';
import { Server } from 'https';

// RKurentoAPI
import {
    getSessions,
    getStats
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


const KMSURI = process.env.KMSURI || "wss://35.190.197.200:8433/kurento";

export default function (app: Express, server:Server,sessionHandler: express.RequestHandler) {

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
            websocketId = req.headers['sec-websocket-key']
        })

        ws.on('error', function (error) {
            console.error('Connection ' + sessionId + ' error');
            // stop(sessionId, websocketId)
        })

        ws.on('close', function () {
            console.log('Connection ' + sessionId + ' , ' + websocketId + ' closed');
            // stop(sessionId, websocketId)
        })

        ws.on('message', async function (_message: string) {
            const message = JSON.parse(_message)

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
                    const stats = await getStats(KMSURI)
                    ws.send(JSON.stringify({
                        id: 'serverStats',
                        room: JSON.stringify(availableRoom), 
                        sessions: JSON.stringify(sessions?.length),
                        stats: JSON.stringify(stats) 
                    }))
                    break

                case 'createRoom':
                    sessionId = request.session.id;
                    websocketId = request.headers['sec-websocket-key'];
                    console.debug("CreateRoom")
                    let roomId; let sdpAnswer;
                    [roomId, sdpAnswer] = await createRoom(KMSURI, websocketId, ws, message.sdpOffer)
                    if (!roomId) {
                        return ws.send(JSON.stringify({
                            id: 'error',
                            message: 'Error creating room'
                        }));
                    }
                    console.debug("Sucessfully CreateRoom : ",roomId)
                    ws.send(JSON.stringify({
                        id: 'createdRoom',
                        roomId: roomId,
                        sdpAnswer: sdpAnswer
                    }));
                    // console.log("Room ", JSON.stringify(RoomsManager.getSingleton().getRoom(roomId), null, 2))
                    break;

                case 'joinRoom':
                    sessionId = request.session.id;
                    websocketId = request.headers['sec-websocket-key'];
                    console.debug("joinRoom")
                    let joinroomId; let joinsdpAnswer; let retry = 0;
                    [joinroomId, joinsdpAnswer] = await joinRoom(websocketId, message.roomId, ws, message.sdpOffer);

                    while (!joinroomId || !joinsdpAnswer) {
                        [joinroomId, joinsdpAnswer] = await joinRoom(websocketId, message.roomId, ws, message.sdpOffer);
                        console.log("Error join room, retry",retry)
                        retry ++;
                        if (retry == 3){
                            return ws.send(JSON.stringify({
                                id: 'error',
                                message: 'Error joining room'
                            }));
                        }
                    }
                    ws.send(JSON.stringify({
                        id: 'joinedRoom',
                        roomId: joinroomId,
                        sdpAnswer: joinsdpAnswer
                    }));
                    // console.log("Room ", JSON.stringify(RoomsManager.getSingleton().getRoom(joinroomId), null, 2))
                    break;

                case 'leaveRoom':
                    sessionId = request.session.id;
                    websocketId = request.headers['sec-websocket-key'];
                    console.debug("leaveRoom")                    
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
                    // console.log("Register collected Ice for sessionId: ", sessionId, " , ws: ", websocketId)
                    onIceCandidate(message.roomId, websocketId, message.candidate);
                    break;

                // default:
                //     ws.send(JSON.stringify({
                //         id: 'error',
                //         message: 'Invalid message ' + message
                //     }))
                //     break
            }
        })
    })
}