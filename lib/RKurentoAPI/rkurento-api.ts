// RKurento-api.js
// Main file for RKurento functionalities
import kurento from 'kurento-client';
import { WebSocket } from 'ws';
import {
    getServerManager,
    createComposite,
    createWebrtcEndpoints,
    createMediaPipeline
} from './rk-basic';
import {
    RoomsManager
} from './rk-room';
import {
    createP2PRoom,
    createMCURoom,
    joinP2PRoom,
    joinMCURoom,
} from './rk-strategies';

export const getStats = async (ws_url: string) => {
    try {
        const serverManager = await getServerManager(ws_url);
        return {
            memory: await serverManager.getUsedMemory(),
            cpu: await serverManager.getUsedCpu(1000),
            cpu_count: await serverManager.getCpuCount(),
            pipelines: (await serverManager.getPipelines()).length,
        };
    } catch (error) {
        console.warn(error);
    }
}

export const getSessions = async (ws_url: string) => {
    try {
        const serverManager = await getServerManager(ws_url);
        return serverManager.getPipelines();
    } catch (error) {
        console.warn(error);
    }
}

export const createRoom = async (ws_url: string, websocketId: string, ws?: WebSocket, sdpOffer?: string, strategy?: string): Promise<[string | undefined, string | undefined]> => {
    let roomId, sdpAnswer;
    switch (strategy) {
        case "p2p": {
            //statements;
            console.debug("Create P2P Room");
            [roomId, sdpAnswer] = createP2PRoom(websocketId, ws, sdpOffer);
            break;
        }
        case "mcu": {
            //statements; 
            console.debug("Create MCU Room");
            [roomId, sdpAnswer] = await createMCURoom(ws_url, websocketId, ws, sdpOffer);
            break;
        }
        default: {
            //statements; 
            break;
        }
    }
    return [roomId, sdpAnswer];
}

export const joinRoom = async (websocketId: string, roomId: string, ws: WebSocket, sdpOffer?: string, strategy?: string): Promise<[string | undefined, string | undefined]> => {
    let status;
    let sdpAnswer;
    switch (strategy) {
        case "p2p": {
            //statements;
            console.debug("Join P2P Room");
            [status] = joinP2PRoom(websocketId, ws, sdpOffer, roomId);
            break;
        }
        case "mcu": {
            //statements; 
            console.debug("Create MCU Room");
            [sdpAnswer] = await joinMCURoom(websocketId, ws, roomId, sdpOffer);
            break;
        }
        default: {
            //statements; 
            break;
        }
    }
    return [roomId, sdpAnswer];
}

export const leaveRoom = async (websocketId: string, roomId: string) => {
    const roomsManager = RoomsManager.getSingleton();
    const room = roomsManager.getRoom(roomId);
    const participant = roomsManager.getParticipant(roomId, websocketId);
    if (participant && room?.participants) {
        console.debug('Removing user from MCU [ ' + roomId + ', ' + websocketId + ' ]');
        // Release participant media elements
        const webRtcEndpoint = participant?.webRtcEndpoint?.release();
        // Delete participant data
        room.participants.splice(room.participants.indexOf(participant), 1);
        room.participants
        // Remove pipeline for last person
        if (room?.participants.length === 0) {
            room.compositeHub?.release();
            room.mediaPipeline?.release();
            console.debug('Removing MediaPipeline and Composite...');
            // Delete room from array
            roomsManager.getAllSessions().splice(roomsManager.getAllSessions().indexOf(room), 1);
            roomsManager.getAllSessions();
        }
        return true
    }
    return false
}

export async function onIceCandidate(roomId: string, websocketId: string, _candidate: kurento.IceCandidate | RTCIceCandidate) {
    const roomsManager = RoomsManager.getSingleton();
    const candidate = kurento.getComplexType('IceCandidate')(_candidate);
    const room = roomsManager.getRoom(roomId);
    console.debug("Debug: iceExch from client", candidate.candidate, roomId, websocketId)
    const participant = roomsManager.getParticipant(roomId, websocketId);
    if (participant) {
        participant.webRtcEndpoint?.addIceCandidate(candidate);
    }
    else {
        roomsManager.updateIceCandidateQueue(roomId, websocketId, candidate);
    }

}

process.on("SIGINT", () => {
    const roomsManager = RoomsManager.getSingleton();
    if (roomsManager.getAllSessions().length > 0) {
        roomsManager.getAllSessions().forEach(element => {
            if (element.mediaPipeline) {
                element.mediaPipeline.release()
            }
        });
    }
    console.log("Bye from RK API Server !")
    process.exit()
})