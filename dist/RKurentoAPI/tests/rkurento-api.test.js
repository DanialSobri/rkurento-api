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
const chai_1 = require("chai");
const mongoose_1 = require("mongoose");
const rkurento_api_1 = require("../rkurento-api");
const rk_room_1 = require("../rk-room");
const rk_basic_1 = require("../rk-basic");
const rk_mongodb_1 = require("../rk-mongodb");
describe('RKurento API Integration Test', function () {
    // Global 
    const kurentoUrl = "ws://167.99.255.24:8888/kurento";
    const roomMgr = rk_room_1.RoomsManager.getSingleton();
    const fakeWsId = "websocket1232";
    let roomID = undefined;
    before(function () {
    });
    after(function () {
        console.info("Debug", JSON.stringify(roomMgr.getRoom(roomID), null, 2));
        if (rk_basic_1.m_kurentoClient) {
            rk_basic_1.m_kurentoClient.close();
        }
        (0, rk_mongodb_1.getConnectionDB)().then(res => {
            if (res === 1) {
                mongoose_1.connection.close().then(res => (console.log("    Closing DB Connection!")));
            }
        });
    });
    it('Create Room', () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        let roomID, sdpAnswer = yield (0, rkurento_api_1.createRoom)(kurentoUrl, fakeWsId);
        (0, chai_1.expect)(roomMgr.getAllSessions().length).equal(1);
        const myRoom = (_a = roomMgr.getRoom(roomID)) === null || _a === void 0 ? void 0 : _a.id;
        (0, chai_1.expect)(roomID).equal(myRoom);
    }));
    it('Update IceCandidates', () => __awaiter(this, void 0, void 0, function* () {
        var _b;
        if (roomID) {
            // roomMgr.updateIceCandidateQueue(roomID,fakeWsId,( {candidate: "candidate:6 2 UDP 2122252542 172.25.32.1 64395 typ host",
            // sdpMid: "string", sdpMLineIndex: 0 }));
            // roomMgr.updateIceCandidateQueue(roomID,fakeWsId,( {candidate: "candidate:6 2 UDP 2122252542 172.25.32.1 64395 typ host",
            // sdpMid: "string", sdpMLineIndex: 0 }));
        }
        (0, chai_1.expect)((_b = roomMgr.getIceCandidatesQueue(roomID, fakeWsId)) === null || _b === void 0 ? void 0 : _b.length).equal(2);
    }));
});
