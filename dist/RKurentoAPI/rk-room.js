"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsManager = void 0;
const nanoid_1 = require("nanoid");
/**
 * The RoomsManager class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
class RoomsManager {
    /**
     * The RoomsManager's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    constructor() { }
    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the RoomsManager class while keeping
     * just one instance of each subclass around.
     */
    static getSingleton() {
        if (!RoomsManager.instance) {
            RoomsManager.instance = new RoomsManager();
        }
        return RoomsManager.instance;
    }
    /**
     * Return all session
     */
    getAllSessions() {
        // Return all active session
        return RoomsManager.rooms;
    }
    /**
     * Registering Room by adding and saving it in an Array
     */
    registerRoom(pipeline, websocketId, webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort) {
        // Register new room
        const roomId = (0, nanoid_1.nanoid)(5);
        // Update Array with basic media object
        RoomsManager.rooms.push({
            id: roomId,
            mediaPipeline: pipeline,
            compositeHub: compositeHub,
            outputAudioPort: outputAudioPort,
            outputVideoPort: outputVideoPort,
            participants: []
        });
        // Update participants endpoints
        this.updateParticipants(roomId, websocketId, webRtcEndpoint);
        return roomId;
    }
    registerRoomP2P(wsId, sdpAnswer, sdpOffer) {
        var _a, _b;
        // Register new room
        const roomId = (0, nanoid_1.nanoid)(5);
        // Update Array with basic media object
        RoomsManager.rooms.push({
            id: roomId,
            participants: []
        });
        // Update participants endpoints
        (_b = (_a = this.getRoom(roomId)) === null || _a === void 0 ? void 0 : _a.participants) === null || _b === void 0 ? void 0 : _b.push({
            wsid: wsId,
            sdpAnswer: sdpAnswer,
            sdpOffer: sdpOffer,
            candidatesQueue: []
        });
        return roomId;
    }
    /**
     * ### UpdateParticipants
     * Update Participants by adding and saving it in an Array
     */
    updateParticipants(roomId, wsid, webRtcEndpoint) {
        var _a, _b;
        // Update participants endpoints
        if (webRtcEndpoint) {
            (_b = (_a = this.getRoom(roomId)) === null || _a === void 0 ? void 0 : _a.participants) === null || _b === void 0 ? void 0 : _b.push({
                wsid: wsid,
                webRtcEndpoint: webRtcEndpoint,
                candidatesQueue: []
            });
            return true;
        }
        return false;
    }
    /**
     * ### UpdateIceCandidate
     * Registering Room by adding and saving it in an Array
     */
    updateIceCandidateQueue(roomId, wsid, iceCandidate) {
        var _a;
        // Return all active session
        // console.info("Get Room", RoomsManager.rooms)
        const participant = this.getParticipant(roomId, wsid);
        (_a = participant === null || participant === void 0 ? void 0 : participant.candidatesQueue) === null || _a === void 0 ? void 0 : _a.push(iceCandidate);
        return RoomsManager.rooms;
    }
    /**
     * ### getRoom
     * Registering Room by adding and saving it in an Array
     */
    getRoom(roomId) {
        // Return room with entered Id
        const result = RoomsManager.rooms.find(room => {
            return room.id === roomId;
        });
        return result;
    }
    /**
     * ### getParticipant
     * Registering Room by adding and saving it in an Array
     */
    getParticipant(roomId, participantWsId) {
        var _a;
        // Return room with entered Id
        const myRoom = this.getRoom(roomId);
        const myParticipant = (_a = myRoom === null || myRoom === void 0 ? void 0 : myRoom.participants) === null || _a === void 0 ? void 0 : _a.find(element => {
            return element.wsid === participantWsId;
        });
        return myParticipant;
    }
    /**
     * ### getParticipants
     * Return participants from roomID in an Array
     */
    getParticipants(roomId) {
        // Return room with entered Id
        const myRoom = this.getRoom(roomId);
        return myRoom === null || myRoom === void 0 ? void 0 : myRoom.participants;
    }
    /**
     * ### getIceCandidates
     * Registering Room by adding and saving it in an Array
     */
    getIceCandidatesQueue(roomId, websocketId) {
        var _a;
        const iceCandidates = (_a = this.getParticipant(roomId, websocketId)) === null || _a === void 0 ? void 0 : _a.candidatesQueue;
        return iceCandidates;
    }
}
exports.RoomsManager = RoomsManager;
RoomsManager.rooms = [];
