import { expect } from 'chai';
import { connection } from 'mongoose';
import {
    createRoomDB,
    connectDB,
    getConnectionDB,
    Room,
    removeRoomDB,
    updateRoomDB
} from '../rk-mongodb';

describe('RKurento MongoDB Test', function () {
    after(function () {
        getConnectionDB().then(
            res => {
                if (res === 1) {
                    connection.close().then(
                        res => (console.log("    Closing DB Connection!")));
                }
            })
    });
    it('Check Database connection', async () => {
        // Check initial connection
        let myDbConn = await getConnectionDB();
        expect(myDbConn).equal(0);
        // Try connecting
        myDbConn = await connectDB();
        expect(myDbConn).equal(1);


    });
    it('Create New Room DB', async () => {
        const roomsBefore = (await Room.find({ name: "MyRoom" })).length;
        // Update DB with new room
        const createdRoomId = await createRoomDB("30b3040-6ba4-4ebf-b204-3f48e6d3aead_kurento.MediaPipeline");
        expect(createdRoomId).to.not.be.null;
        // Get DB by calling room ID
        await Room.findByIdAndDelete({ _id: createdRoomId });
        const roomsAfter = (await Room.find({})).length;
        expect(roomsBefore).equal(roomsAfter);

    });
    it('Remove Room from Database', async () => {
        // Create Room with name "DebugRoom"
        const createdRoomId = await createRoomDB("30b3040-6ba4-4ebf-b204-3f48e6d3aead_kurento.MediaPipeline", "DebugRoom");
        // Test removing the Room
        await removeRoomDB(createdRoomId);
        expect((await Room.find({ name: "DebugRoom" })).length).equal(0);
    });
    it('Update Room by adding participants', async () => {
        // Create Room with name "DebugRoom"
        const createdRoomId = await createRoomDB("30b3040-6ba4-4ebf-b204-3f48e6d3aead_kurento.MediaPipeline", "DebugRoom");
        let room = await Room.findOne({ roomId: createdRoomId })
        // Test updating participants list
        updateRoomDB(createdRoomId, ["user1"]).then(
            () => (expect(room?.participants?.length).equal(1))
        )
        // Remove the Room
        await removeRoomDB(createdRoomId);
    });
});