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
const rk_mongodb_1 = require("../rk-mongodb");
describe('RKurento MongoDB Test', function () {
    after(function () {
        (0, rk_mongodb_1.getConnectionDB)().then(res => {
            if (res === 1) {
                mongoose_1.connection.close().then(res => (console.log("    Closing DB Connection!")));
            }
        });
    });
    it('Check Database connection', () => __awaiter(this, void 0, void 0, function* () {
        // Check initial connection
        let myDbConn = yield (0, rk_mongodb_1.getConnectionDB)();
        (0, chai_1.expect)(myDbConn).equal(0);
        // Try connecting
        myDbConn = yield (0, rk_mongodb_1.connectDB)();
        (0, chai_1.expect)(myDbConn).equal(1);
    }));
    it('Create New Room DB', () => __awaiter(this, void 0, void 0, function* () {
        const roomsBefore = (yield rk_mongodb_1.Room.find({ name: "MyRoom" })).length;
        // Update DB with new room
        const createdRoomId = yield (0, rk_mongodb_1.createRoomDB)("30b3040-6ba4-4ebf-b204-3f48e6d3aead_kurento.MediaPipeline");
        (0, chai_1.expect)(createdRoomId).to.not.be.null;
        // Get DB by calling room ID
        yield rk_mongodb_1.Room.findByIdAndDelete({ _id: createdRoomId });
        const roomsAfter = (yield rk_mongodb_1.Room.find({})).length;
        (0, chai_1.expect)(roomsBefore).equal(roomsAfter);
    }));
    it('Remove Room from Database', () => __awaiter(this, void 0, void 0, function* () {
        // Create Room with name "DebugRoom"
        const createdRoomId = yield (0, rk_mongodb_1.createRoomDB)("30b3040-6ba4-4ebf-b204-3f48e6d3aead_kurento.MediaPipeline", "DebugRoom");
        // Test removing the Room
        yield (0, rk_mongodb_1.removeRoomDB)(createdRoomId);
        (0, chai_1.expect)((yield rk_mongodb_1.Room.find({ name: "DebugRoom" })).length).equal(0);
    }));
    it('Update Room by adding participants', () => __awaiter(this, void 0, void 0, function* () {
        // Create Room with name "DebugRoom"
        const createdRoomId = yield (0, rk_mongodb_1.createRoomDB)("30b3040-6ba4-4ebf-b204-3f48e6d3aead_kurento.MediaPipeline", "DebugRoom");
        let room = yield rk_mongodb_1.Room.findOne({ roomId: createdRoomId });
        // Test updating participants list
        (0, rk_mongodb_1.updateRoomDB)(createdRoomId, ["user1"]).then(() => { var _a; return ((0, chai_1.expect)((_a = room === null || room === void 0 ? void 0 : room.participants) === null || _a === void 0 ? void 0 : _a.length).equal(1)); });
        // Remove the Room
        yield (0, rk_mongodb_1.removeRoomDB)(createdRoomId);
    }));
});
