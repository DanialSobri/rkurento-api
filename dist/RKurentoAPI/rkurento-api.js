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
exports.onIceCandidate = exports.leaveRoom = exports.joinRoom = exports.createRoom = exports.getSessions = exports.getStats = void 0;
// RKurento-api.js
// Main file for RKurento functionalities
const kurento_client_1 = __importDefault(require("kurento-client"));
const rk_basic_1 = require("./rk-basic");
const rk_room_1 = require("./rk-room");
const rk_strategies_1 = require("./rk-strategies");
const getStats = (ws_url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serverManager = yield (0, rk_basic_1.getServerManager)(ws_url);
        return {
            memory: yield serverManager.getUsedMemory(),
            cpu: yield serverManager.getUsedCpu(1000),
            cpu_count: yield serverManager.getCpuCount(),
            pipelines: (yield serverManager.getPipelines()).length,
        };
    }
    catch (error) {
        console.warn(error);
    }
});
exports.getStats = getStats;
const getSessions = (ws_url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serverManager = yield (0, rk_basic_1.getServerManager)(ws_url);
        return serverManager.getPipelines();
    }
    catch (error) {
        console.warn(error);
    }
});
exports.getSessions = getSessions;
const createRoom = (ws_url, websocketId, ws, sdpOffer, strategy) => __awaiter(void 0, void 0, void 0, function* () {
    let roomId, sdpAnswer;
    switch (strategy) {
        case "p2p": {
            //statements;
            console.debug("Create P2P Room");
            [roomId, sdpAnswer] = (0, rk_strategies_1.createP2PRoom)(websocketId, ws, sdpOffer);
            break;
        }
        case "mcu": {
            //statements; 
            console.debug("Create MCU Room");
            [roomId, sdpAnswer] = yield (0, rk_strategies_1.createMCURoom)(ws_url, websocketId, ws, sdpOffer);
            break;
        }
        default: {
            //statements; 
            break;
        }
    }
    return [roomId, sdpAnswer];
});
exports.createRoom = createRoom;
const joinRoom = (websocketId, roomId, ws, sdpOffer, strategy) => __awaiter(void 0, void 0, void 0, function* () {
    let status;
    let sdpAnswer;
    switch (strategy) {
        case "p2p": {
            //statements;
            console.debug("Join P2P Room");
            [status] = (0, rk_strategies_1.joinP2PRoom)(websocketId, ws, sdpOffer, roomId);
            break;
        }
        case "mcu": {
            //statements; 
            console.debug("Create MCU Room");
            [sdpAnswer] = yield (0, rk_strategies_1.joinMCURoom)(websocketId, ws, roomId, sdpOffer);
            break;
        }
        default: {
            //statements; 
            break;
        }
    }
    return [roomId, sdpAnswer];
});
exports.joinRoom = joinRoom;
const leaveRoom = (websocketId, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const roomsManager = rk_room_1.RoomsManager.getSingleton();
    const room = roomsManager.getRoom(roomId);
    const participant = roomsManager.getParticipant(roomId, websocketId);
    if (participant && (room === null || room === void 0 ? void 0 : room.participants)) {
        console.debug('Removing user from MCU [ ' + roomId + ', ' + websocketId + ' ]');
        // Release participant media elements
        const webRtcEndpoint = (_a = participant === null || participant === void 0 ? void 0 : participant.webRtcEndpoint) === null || _a === void 0 ? void 0 : _a.release();
        // Delete participant data
        room.participants.splice(room.participants.indexOf(participant), 1);
        room.participants;
        // Remove pipeline for last person
        if ((room === null || room === void 0 ? void 0 : room.participants.length) === 0) {
            (_b = room.compositeHub) === null || _b === void 0 ? void 0 : _b.release();
            (_c = room.mediaPipeline) === null || _c === void 0 ? void 0 : _c.release();
            console.debug('Removing MediaPipeline and Composite...');
            // Delete room from array
            roomsManager.getAllSessions().splice(roomsManager.getAllSessions().indexOf(room), 1);
            roomsManager.getAllSessions();
        }
        return true;
    }
    return false;
});
exports.leaveRoom = leaveRoom;
function onIceCandidate(roomId, websocketId, _candidate) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const roomsManager = rk_room_1.RoomsManager.getSingleton();
        const candidate = kurento_client_1.default.getComplexType('IceCandidate')(_candidate);
        const room = roomsManager.getRoom(roomId);
        console.debug("Debug: iceExch from client", candidate.candidate, roomId, websocketId);
        const participant = roomsManager.getParticipant(roomId, websocketId);
        if (participant) {
            (_a = participant.webRtcEndpoint) === null || _a === void 0 ? void 0 : _a.addIceCandidate(candidate);
        }
        else {
            roomsManager.updateIceCandidateQueue(roomId, websocketId, candidate);
        }
    });
}
exports.onIceCandidate = onIceCandidate;
process.on("SIGINT", () => {
    const roomsManager = rk_room_1.RoomsManager.getSingleton();
    if (roomsManager.getAllSessions().length > 0) {
        roomsManager.getAllSessions().forEach(element => {
            if (element.mediaPipeline) {
                element.mediaPipeline.release();
            }
        });
    }
    console.log("Bye from RK API Server !");
    process.exit();
});
