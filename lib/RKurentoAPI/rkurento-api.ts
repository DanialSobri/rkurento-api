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

export const getStats = async (ws_url: string) => {
    try {
        const serverManager = await getServerManager(ws_url);
        return {
            memory:await serverManager.getUsedMemory(),
            cpu:await serverManager.getUsedCpu(1000),
            cpu_count: await serverManager.getCpuCount(),
            pipelines: (await serverManager.getPipelines()).length,
        };
    } catch (error) {
        console.log(error);
    }
}

export const getSessions = async (ws_url: string) => {
    try {
        const serverManager = await getServerManager(ws_url);
        return serverManager.getPipelines();
    } catch (error) {
        console.log(error);
    }
}

const createMediaElement = async (pipeline: kurento.MediaPipeline, compositeHub: kurento.Composite):
    Promise<kurento.WebRtcEndpoint> => {

    // Create all importants component
    const webRtcEndpoint = await createWebrtcEndpoints(pipeline);
    const outputVideoPort = await compositeHub.createHubPort();
    const outputAudioPort = await compositeHub.createHubPort();

    try {
        // Connect all Media Elements
        webRtcEndpoint.connect(outputVideoPort, 'VIDEO');
        outputVideoPort.connect(webRtcEndpoint, 'VIDEO');
        webRtcEndpoint.connect(outputAudioPort, 'AUDIO');
        outputAudioPort.connect(webRtcEndpoint, 'AUDIO');
    } catch (error) {
        pipeline.release();
        console.log(error);
    } finally {
        return webRtcEndpoint
    }

}

const initMediaElements = async (pipeline: kurento.MediaPipeline): Promise<[kurento.WebRtcEndpoint,
    kurento.Composite, kurento.HubPort, kurento.HubPort]> => {

    // Create all importants component
    const webRtcEndpoint = await createWebrtcEndpoints(pipeline);
    await webRtcEndpoint.setMinVideoSendBandwidth(1000);
    await webRtcEndpoint.setMaxVideoSendBandwidth(2000);
    const compositeHub = await createComposite(pipeline);
    const outputVideoPort = await compositeHub.createHubPort();
    const outputAudioPort = await compositeHub.createHubPort();

    try {
        // Connect all Media Elements
        webRtcEndpoint.connect(outputVideoPort, 'VIDEO');
        outputVideoPort.connect(webRtcEndpoint, 'VIDEO');
        webRtcEndpoint.connect(outputAudioPort, 'AUDIO');
        outputAudioPort.connect(webRtcEndpoint, 'AUDIO');

    } catch (error) {
        pipeline.release();
        console.log(error);
    } finally {
        return [webRtcEndpoint, compositeHub, outputVideoPort, outputAudioPort];
    }
}

export const createRoom = async (ws_url: string, websocketId: string, ws?: WebSocket, sdpOffer?: string): Promise<[string | undefined, string | undefined]> => {
    // Initialize pipeline
    const pipeline = await createMediaPipeline(ws_url);
    try {
        // Create Room with given pipeline ID
        const roomsManager = RoomsManager.getSingleton();
        const [webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort] = await initMediaElements(pipeline);
        const roomId = roomsManager.registerRoom(pipeline, websocketId, webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort);
        let sdpAnswer = "";

        if (roomId && websocketId) {
            // Add available IceCandidates
            let candidatesQueue = roomsManager.getIceCandidatesQueue(roomId, websocketId);
            if (candidatesQueue) {
                while (candidatesQueue.length) {
                    console.info(JSON.stringify(candidatesQueue, null, 2));
                    var candidate = candidatesQueue.shift();
                    if (candidate) {
                        webRtcEndpoint.addIceCandidate(candidate);
                    };
                }
            }
            // OnIceCandidate Event
            if (ws) {
                webRtcEndpoint.on('OnIceCandidate', function (event) {
                    let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate
                    }));
                });
                sdpAnswer = await webRtcEndpoint.processOffer(sdpOffer!);
                webRtcEndpoint.gatherCandidates().catch(error => { return error });
            }

        }
        return [roomId, sdpAnswer];

    } catch (error) {
        console.log(error);
        pipeline.release();
        return [undefined, undefined];
    }
}

//
export const joinRoom = async (websocketId: string, roomId: string, ws?: WebSocket, sdpOffer?: string): Promise<[string | undefined, string | undefined]> => {
    try {
        // Get Room with given ID
        const roomsManager = RoomsManager.getSingleton();
        const room = roomsManager.getRoom(roomId);
        const pipeline = room?.mediaPipeline;
        const compositeHub = room?.compositeHub;
        let sdpAnswer = "";
        let webRtcEndpoint;

        if (pipeline && compositeHub) {
            console.info("Join Room :", room.id);
            webRtcEndpoint = await createMediaElement(pipeline, compositeHub);
            roomsManager.updateParticipants(roomId, websocketId, webRtcEndpoint);
        }

        if (roomId && websocketId && webRtcEndpoint) {
            // Add available IceCandidates
            let candidatesQueue = roomsManager.getIceCandidatesQueue(roomId, websocketId);
            if (candidatesQueue) {
                while (candidatesQueue.length) {
                    console.info(JSON.stringify(candidatesQueue, null, 2));
                    var candidate = candidatesQueue.shift();
                    if (candidate) {
                        webRtcEndpoint.addIceCandidate(candidate);
                    };
                }
            }
            // OnIceCandidate Event
            if (ws) {
                webRtcEndpoint.on('OnIceCandidate', function (event) {
                    let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate
                    }));
                });
                sdpAnswer = await webRtcEndpoint.processOffer(sdpOffer!);
                webRtcEndpoint.gatherCandidates().catch(error => { return error });
            }
        }
        return [roomId, sdpAnswer];

    } catch (error) {
        console.warn(error);
        return [undefined, undefined];
    }
}

// stop(sessionId, websocketId);
export const leaveRoom = async (websocketId: string, roomId: string) => {
    const roomsManager = RoomsManager.getSingleton();
    const room = roomsManager.getRoom(roomId);
    const participant = roomsManager.getParticipant(roomId, websocketId);
    if (participant && room?.participants) {
        console.log('Removing user from MCU [ ' + roomId + ', ' + websocketId + ' ]');
        // Release participant media elements
        const webRtcEndpoint = participant?.webRtcEndpoint?.release();
        // Delete participant data
        room.participants.splice(room.participants.indexOf(participant), 1);
        room.participants
        // Remove pipeline for last person
        if (room?.participants.length === 0) {
            room.compositeHub?.release();
            room.mediaPipeline?.release();
            console.log('Removing MediaPipeline and Composite...');
            // Delete room from array
            roomsManager.getAllSessions().splice(roomsManager.getAllSessions().indexOf(room), 1);
            roomsManager.getAllSessions();
        }
        return true
    }
    return false
}

export function onIceCandidate(roomId: string, websocketId: string, _candidate: kurento.IceCandidate | RTCIceCandidate) {
    const roomsManager = RoomsManager.getSingleton();
    const candidate = kurento.getComplexType('IceCandidate')(_candidate);
    const room = roomsManager.getRoom(roomId);
    const participant = roomsManager.getParticipant(roomId, websocketId);

    if (room) {
        if (participant) {
            participant.webRtcEndpoint?.addIceCandidate(candidate);
        }
        else {
            roomsManager.updateIceCandidateQueue(roomId, websocketId, candidate);
        }
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