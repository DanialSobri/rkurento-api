import { expect } from 'chai';
import { Types } from 'mongoose';
import { connection } from 'mongoose';
import { 
    createRoom
    } from '../rkurento-api';
import { 
    RoomsManager
    } from '../rk-room';
import {
    m_kurentoClient,
    } from '../rk-basic'
import {
    Room,
    removeRoomDB,
    getConnectionDB
    } from '../rk-mongodb'

describe('RKurento API Integration Test', function() {
    // Global 
    const kurentoUrl = "ws://167.99.255.24:8888/kurento";
    const roomMgr = RoomsManager.getSingleton();
    const fakeWsId = "websocket1232";
    let roomID:string | undefined = undefined;

    before(function () {
    });
    after(function () {
        console.info("Debug", JSON.stringify(roomMgr.getRoom(roomID), null, 2))
        if(m_kurentoClient){
            m_kurentoClient.close()
        }
        getConnectionDB().then(
            res => {
                if (res === 1) {
                    connection.close().then(
                        res => (console.log("    Closing DB Connection!")));
                }
            })            
    });

    it('Create Room', async () => {
        let roomID,sdpAnswer = await createRoom(kurentoUrl,fakeWsId);
        expect(roomMgr.getAllSessions().length).equal(1);
        const myRoom = roomMgr.getRoom(roomID)?.id;
        expect(roomID).equal(myRoom);
    });
    it('Update IceCandidates', async () => {
        if (roomID){
            // roomMgr.updateIceCandidateQueue(roomID,fakeWsId,( {candidate: "candidate:6 2 UDP 2122252542 172.25.32.1 64395 typ host",
            // sdpMid: "string", sdpMLineIndex: 0 }));
            // roomMgr.updateIceCandidateQueue(roomID,fakeWsId,( {candidate: "candidate:6 2 UDP 2122252542 172.25.32.1 64395 typ host",
            // sdpMid: "string", sdpMLineIndex: 0 }));
        }
        expect(roomMgr.getIceCandidatesQueue(roomID,fakeWsId)?.length).equal(2);
    });
});