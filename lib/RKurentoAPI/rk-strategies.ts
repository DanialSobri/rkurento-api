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

const initMediaElements = async (pipeline: kurento.MediaPipeline): Promise<[kurento.WebRtcEndpoint,
    kurento.Composite, kurento.HubPort, kurento.HubPort]> => {

    // Create all importants component
    const webRtcEndpoint = await createWebrtcEndpoints(pipeline);
    // await webRtcEndpoint.setMinVideoSendBandwidth(1000);
    await webRtcEndpoint.setMaxVideoSendBandwidth(500);
    await webRtcEndpoint.setMaxVideoRecvBandwidth(500);
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
        console.warn(error);
    } finally {
        return [webRtcEndpoint, compositeHub, outputVideoPort, outputAudioPort];
    }
}

const createMediaElement = async (pipeline: kurento.MediaPipeline, compositeHub: kurento.Composite):
    Promise<kurento.WebRtcEndpoint> => {

    // Create all importants component
    const webRtcEndpoint = await createWebrtcEndpoints(pipeline);
    // await webRtcEndpoint.setMinVideoSendBandwidth(1000);
    await webRtcEndpoint.setMaxVideoSendBandwidth(500);
    await webRtcEndpoint.setMaxVideoRecvBandwidth(500);
    const outputVideoPort = await compositeHub.createHubPort();
    const outputAudioPort = await compositeHub.createHubPort();

    if (webRtcEndpoint && outputVideoPort && outputAudioPort) {
        // Connect all Media Elements
        await webRtcEndpoint.connect(outputVideoPort, 'VIDEO');
        await outputVideoPort.connect(webRtcEndpoint, 'VIDEO');
        await webRtcEndpoint.connect(outputAudioPort, 'AUDIO');
        await outputAudioPort.connect(webRtcEndpoint, 'AUDIO');
    }
    else {
        console.warn("Error connect elements")
    }

    return webRtcEndpoint
}

export function createP2PRoom(websocketId: string, ws?: WebSocket, sdpOffer?: string) {
    // Create a new room using P2P stategy
    // Client A will create room and save the sdp offer in the room
    // Client B will join the room and generate sdp answer for client A
    const roomsManager = RoomsManager.getSingleton();
    // Create a P2P Room
    const roomId = roomsManager.registerRoomP2P(websocketId, undefined ,sdpOffer);
    return [roomId];
}

export function joinP2PRoom(websocketId: string, ws?: WebSocket, sdpOffer?: string, roomId?: string) {
    // Create a new room using P2P stategy
    // Client A will create room and save the sdp offer in the room
    // Client B will join the room and generate sdp answer for client A
    const roomsManager = RoomsManager.getSingleton();
    // Create a P2P Room
    // const roomId = roomsManager.registerRoomP2P(websocketId, undefined ,sdpOffer);
    return [roomId];
}

export async function joinMCURoom(websocketId: string, ws: WebSocket, roomId: string, sdpOffer?: string) {
    // Create a new room using MCU stategy
    try {
        // Get Room with given ID
        const roomsManager = RoomsManager.getSingleton();
        const room = roomsManager.getRoom(roomId);
        const pipeline = room?.mediaPipeline;
        const compositeHub = room?.compositeHub;
        let sdpAnswer = "";
        let webRtcEndpoint;

        // Check server connection, if not connected, connect it again
        if (pipeline && compositeHub) {
            webRtcEndpoint = await createMediaElement(pipeline, compositeHub);
            roomsManager.updateParticipants(roomId, websocketId, webRtcEndpoint);
            console.debug(roomsManager.getParticipants(room?.id)?.length, "Join Room :", room?.id);
        }

        if (roomId && websocketId && webRtcEndpoint) {
            // Add available IceCandidates
            let candidatesQueue = roomsManager.getIceCandidatesQueue(roomId, websocketId);
            if (candidatesQueue) {
                while (candidatesQueue.length) {
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
                    if (candidate == null) {
                        console.debug("candidate", candidate, "is null")
                    }
                    if (candidate) {
                        ws.send(JSON.stringify({
                            id: 'iceCandidate',
                            candidate: candidate
                        }));
                    }
                });
                sdpAnswer = await webRtcEndpoint.processOffer(sdpOffer!);
                webRtcEndpoint.gatherCandidates().catch(error => { return error });
            }
        }
        return [sdpAnswer];

    } catch (error) {
        console.info("Join Room", error);
        return [undefined];
    }
}

export async function createMCURoom(ws_url: string, websocketId: string, ws?: WebSocket, sdpOffer?: string) {
    let sdpAnswer = "";
    // Create new MediaPipeline
    const pipeline = await createMediaPipeline(ws_url);
    // Register in rooms Manager
    const roomsManager = RoomsManager.getSingleton();
    const [webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort] = await initMediaElements(pipeline);
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
            };
        }
    }
    if (ws) {
        webRtcEndpoint.on('OnIceCandidate', function (event) {
            let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            console.debug("Debug: iceExch to client", candidate.candidate)
            ws.send(JSON.stringify({
                id: 'iceCandidate',
                candidate: candidate
            }));
        });
        sdpAnswer = await webRtcEndpoint.processOffer(sdpOffer!);
        webRtcEndpoint.gatherCandidates().catch(error => { return error });
    }
    return [roomId, sdpAnswer];
}
