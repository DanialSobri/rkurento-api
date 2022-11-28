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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMCURoom = exports.joinMCURoom = exports.joinP2PRoom = exports.createP2PRoom = void 0;
const kurento_client_1 = __importDefault(require("kurento-client"));
const rk_basic_1 = require("./rk-basic");
const rk_room_1 = require("./rk-room");
const initMediaElements = (pipeline) => __awaiter(void 0, void 0, void 0, function* () {
    // Create all importants component
    const webRtcEndpoint = yield (0, rk_basic_1.createWebrtcEndpoints)(pipeline);
    // await webRtcEndpoint.setMinVideoSendBandwidth(1000);
    yield webRtcEndpoint.setMaxVideoSendBandwidth(500);
    yield webRtcEndpoint.setMaxVideoRecvBandwidth(500);
    const compositeHub = yield (0, rk_basic_1.createComposite)(pipeline);
    const outputVideoPort = yield compositeHub.createHubPort();
    const outputAudioPort = yield compositeHub.createHubPort();
    try {
        // Connect all Media Elements
        webRtcEndpoint.connect(outputVideoPort, 'VIDEO');
        outputVideoPort.connect(webRtcEndpoint, 'VIDEO');
        webRtcEndpoint.connect(outputAudioPort, 'AUDIO');
        outputAudioPort.connect(webRtcEndpoint, 'AUDIO');
    }
    catch (error) {
        pipeline.release();
        console.warn(error);
    }
    finally {
        return [webRtcEndpoint, compositeHub, outputVideoPort, outputAudioPort];
    }
});
const createMediaElement = (pipeline, compositeHub) => __awaiter(void 0, void 0, void 0, function* () {
    // Create all importants component
    const webRtcEndpoint = yield (0, rk_basic_1.createWebrtcEndpoints)(pipeline);
    // await webRtcEndpoint.setMinVideoSendBandwidth(1000);
    yield webRtcEndpoint.setMaxVideoSendBandwidth(500);
    yield webRtcEndpoint.setMaxVideoRecvBandwidth(500);
    const outputVideoPort = yield compositeHub.createHubPort();
    const outputAudioPort = yield compositeHub.createHubPort();
    if (webRtcEndpoint && outputVideoPort && outputAudioPort) {
        // Connect all Media Elements
        yield webRtcEndpoint.connect(outputVideoPort, 'VIDEO');
        yield outputVideoPort.connect(webRtcEndpoint, 'VIDEO');
        yield webRtcEndpoint.connect(outputAudioPort, 'AUDIO');
        yield outputAudioPort.connect(webRtcEndpoint, 'AUDIO');
    }
    else {
        console.warn("Error connect elements");
    }
    return webRtcEndpoint;
});
function createP2PRoom(websocketId, ws, sdpOffer) {
    // Create a new room using P2P stategy
    // Client A will create room and save the sdp offer in the room
    // Client B will join the room and generate sdp answer for client A
    const roomsManager = rk_room_1.RoomsManager.getSingleton();
    // Create a P2P Room
    const roomId = roomsManager.registerRoomP2P(websocketId, undefined, sdpOffer);
    return [roomId];
}
exports.createP2PRoom = createP2PRoom;
function joinP2PRoom(websocketId, ws, sdpOffer, roomId) {
    // Create a new room using P2P stategy
    // Client A will create room and save the sdp offer in the room
    // Client B will join the room and generate sdp answer for client A
    const roomsManager = rk_room_1.RoomsManager.getSingleton();
    // Create a P2P Room
    // const roomId = roomsManager.registerRoomP2P(websocketId, undefined ,sdpOffer);
    return [roomId];
}
exports.joinP2PRoom = joinP2PRoom;
function joinMCURoom(websocketId, ws, roomId, sdpOffer) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Create a new room using MCU stategy
        try {
            // Get Room with given ID
            const roomsManager = rk_room_1.RoomsManager.getSingleton();
            const room = roomsManager.getRoom(roomId);
            const pipeline = room === null || room === void 0 ? void 0 : room.mediaPipeline;
            const compositeHub = room === null || room === void 0 ? void 0 : room.compositeHub;
            let sdpAnswer = "";
            let webRtcEndpoint;
            // Check server connection, if not connected, connect it again
            if (pipeline && compositeHub) {
                webRtcEndpoint = yield createMediaElement(pipeline, compositeHub);
                roomsManager.updateParticipants(roomId, websocketId, webRtcEndpoint);
                console.debug((_a = roomsManager.getParticipants(room === null || room === void 0 ? void 0 : room.id)) === null || _a === void 0 ? void 0 : _a.length, "Join Room :", room === null || room === void 0 ? void 0 : room.id);
            }
            if (roomId && websocketId && webRtcEndpoint) {
                // Add available IceCandidates
                let candidatesQueue = roomsManager.getIceCandidatesQueue(roomId, websocketId);
                if (candidatesQueue) {
                    while (candidatesQueue.length) {
                        var candidate = candidatesQueue.shift();
                        if (candidate) {
                            webRtcEndpoint.addIceCandidate(candidate);
                        }
                        ;
                    }
                }
                // OnIceCandidate Event
                if (ws) {
                    webRtcEndpoint.on('OnIceCandidate', function (event) {
                        let candidate = kurento_client_1.default.getComplexType('IceCandidate')(event.candidate);
                        if (candidate == null) {
                            console.debug("candidate", candidate, "is null");
                        }
                        if (candidate) {
                            ws.send(JSON.stringify({
                                id: 'iceCandidate',
                                candidate: candidate
                            }));
                        }
                    });
                    sdpAnswer = yield webRtcEndpoint.processOffer(sdpOffer);
                    webRtcEndpoint.gatherCandidates().catch(error => { return error; });
                }
            }
            return [sdpAnswer];
        }
        catch (error) {
            console.info("Join Room", error);
            return [undefined];
        }
    });
}
exports.joinMCURoom = joinMCURoom;
function createMCURoom(ws_url, websocketId, ws, sdpOffer) {
    return __awaiter(this, void 0, void 0, function* () {
        let sdpAnswer = "";
        // Create new MediaPipeline
        const pipeline = yield (0, rk_basic_1.createMediaPipeline)(ws_url);
        // Register in rooms Manager
        const roomsManager = rk_room_1.RoomsManager.getSingleton();
        const [webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort] = yield initMediaElements(pipeline);
        const roomId = roomsManager.registerRoom(pipeline, websocketId, webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort);
        console.log("Room created with ID: " + roomId);
        // IceCandidates and OnIceCandidate Event
        let candidatesQueue = roomsManager.getIceCandidatesQueue(roomId, websocketId);
        if (candidatesQueue) {
            while (candidatesQueue.length) {
                console.info(JSON.stringify(candidatesQueue, null, 2));
                var candidate = candidatesQueue.shift();
                if (candidate) {
                    webRtcEndpoint.addIceCandidate(candidate);
                }
                ;
            }
        }
        if (ws) {
            webRtcEndpoint.on('OnIceCandidate', function (event) {
                let candidate = kurento_client_1.default.getComplexType('IceCandidate')(event.candidate);
                console.debug("Debug: iceExch to client", candidate.candidate);
                ws.send(JSON.stringify({
                    id: 'iceCandidate',
                    candidate: candidate
                }));
            });
            sdpAnswer = yield webRtcEndpoint.processOffer(sdpOffer);
            webRtcEndpoint.gatherCandidates().catch(error => { return error; });
        }
        return [roomId, sdpAnswer];
    });
}
exports.createMCURoom = createMCURoom;
