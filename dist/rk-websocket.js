"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ws_1 = require("ws");
// RKurentoAPI
const rkurento_api_1 = require("./RKurentoAPI/rkurento-api");
const rkurento_api_2 = require("./RKurentoAPI/rkurento-api");
const rk_room_1 = require("./RKurentoAPI/rk-room");
const KMSURI = process.env.KMSURI || "wss://35.190.197.200:8433/kurento";
function default_1(app, server, sessionHandler) {
    const wss = new ws_1.WebSocketServer({
        server: server,
        maxPayload: 128 * 1024,
        path: '/rkapi'
    });
    /*
    * Management of WebSocket messages
    */
    wss.on('connection', function (ws, request) {
        let sessionId = "";
        let websocketId = null; // differ tabs
        const req = request;
        let res = express_1.response.writeHead(200, {});
        // Apply session handling
        sessionHandler(req, res, function () {
            sessionId = req.session.id;
            websocketId = req.headers['sec-websocket-key'];
        });
        ws.on('error', function (error) {
            console.error('Connection ' + sessionId + ' error');
            // stop(sessionId, websocketId)
        });
        ws.on('close', function () {
            console.log('Connection ' + sessionId + ' , ' + websocketId + ' closed');
            // stop(sessionId, websocketId)
        });
        ws.on('message', function (_message) {
            return __awaiter(this, void 0, void 0, function* () {
                const message = JSON.parse(_message);
                switch (message.id) {
                    case 'ping':
                        ws.send(JSON.stringify({
                            id: 'pong',
                            message: 'from RK API Server for client with ' + sessionId
                        }));
                        break;
                    case 'stats':
                        const availableRoom = rk_room_1.RoomsManager.getSingleton().getAllSessions();
                        const sessions = yield (0, rkurento_api_1.getSessions)(KMSURI);
                        const stats = yield (0, rkurento_api_1.getStats)(KMSURI);
                        ws.send(JSON.stringify({
                            id: 'serverStats',
                            room: JSON.stringify(availableRoom),
                            sessions: JSON.stringify(sessions === null || sessions === void 0 ? void 0 : sessions.length),
                            stats: JSON.stringify(stats)
                        }));
                        break;
                    case 'createRoom':
                        sessionId = request.session.id;
                        websocketId = request.headers['sec-websocket-key'];
                        console.debug("CreateRoom");
                        let roomId;
                        let sdpAnswer;
                        [roomId, sdpAnswer] = yield (0, rkurento_api_2.createRoom)(KMSURI, websocketId, ws, message.sdpOffer, "mcu");
                        if (!roomId) {
                            return ws.send(JSON.stringify({
                                id: 'error',
                                message: 'Error creating room'
                            }));
                        }
                        console.debug("Sucessfully CreateRoom : ", roomId);
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
                        console.debug("joinRoom");
                        let joinroomId;
                        let joinsdpAnswer;
                        [joinroomId, joinsdpAnswer] = yield (0, rkurento_api_2.joinRoom)(websocketId, message.roomId, ws, message.sdpOffer, "mcu");
                        ws.send(JSON.stringify({
                            id: 'joinedRoom',
                            roomId: joinroomId,
                            sdpAnswer: joinsdpAnswer
                        }));
                        break;
                    case 'leaveRoom':
                        sessionId = request.session.id;
                        websocketId = request.headers['sec-websocket-key'];
                        console.debug("leaveRoom");
                        if (yield (0, rkurento_api_2.leaveRoom)(websocketId, message.roomId)) {
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
                        (0, rkurento_api_2.onIceCandidate)(message.roomId, websocketId, message.candidate);
                        break;
                    // default:
                    //     ws.send(JSON.stringify({
                    //         id: 'error',
                    //         message: 'Invalid message ' + message
                    //     }))
                    //     break
                }
            });
        });
    });
}
exports.default = default_1;
