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
exports.updateRoomDB = exports.removeRoomDB = exports.createRoomDB = exports.getConnectionDB = exports.connectDB = exports.Room = void 0;
const nanoid_1 = require("nanoid");
const mongoose_1 = require("mongoose");
// Schema corresponding to the document interface.
const roomSchema = new mongoose_1.Schema({
    roomid: { type: String },
    name: { type: String },
    mediaPipeline: { type: String },
    mediaElements: { type: [String] },
    participants: { type: [String] } // kurento.WebrctEnpoint.id
});
// Model definitions
exports.Room = (0, mongoose_1.model)('Room', roomSchema);
// Function definitions
function isDbConnected() {
    return (mongoose_1.connection.readyState == 1 ? true : false);
}
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mongoose_1.connect)('mongodb://localhost:27017/room');
    return mongoose_1.connection.readyState;
});
exports.connectDB = connectDB;
const getConnectionDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return mongoose_1.connection.readyState;
});
exports.getConnectionDB = getConnectionDB;
function createRoomDB(pipelineID, name) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create new room and return Room ID
        if (isDbConnected() === false) {
            yield (0, mongoose_1.connect)('mongodb://localhost:27017/room');
        }
        if (isDbConnected() === true) {
            const room = new exports.Room({
                roomid: (0, nanoid_1.nanoid)(5),
                name: "MyRoom",
                mediaPipeline: pipelineID,
            });
            yield room.save().catch(err => { console.log(err); return undefined; });
            return room.id;
        }
        return undefined;
    });
}
exports.createRoomDB = createRoomDB;
function removeRoomDB(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isDbConnected() === false) {
            yield (0, mongoose_1.connect)('mongodb://localhost:27017/room');
        }
        // Get Room from given ID
        if (id) {
            const room = yield exports.Room.findByIdAndDelete(id).exec();
        }
    });
}
exports.removeRoomDB = removeRoomDB;
function updateRoomDB(id, participantId, mediaElement) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // Connect to MongoDB
        if (isDbConnected() === false) {
            yield (0, mongoose_1.connect)('mongodb://localhost:27017/room');
        }
        // Get Room from given ID
        const room = yield exports.Room.findById(id);
        // Update participants in DB 
        if (participantId) {
            room.participants = (_a = room === null || room === void 0 ? void 0 : room.participants) === null || _a === void 0 ? void 0 : _a.concat(participantId);
        }
        // Update media server element
        if (mediaElement) {
            room.mediaElements = (_b = room === null || room === void 0 ? void 0 : room.mediaElements) === null || _b === void 0 ? void 0 : _b.concat(mediaElement);
        }
        yield (room === null || room === void 0 ? void 0 : room.save());
    });
}
exports.updateRoomDB = updateRoomDB;
