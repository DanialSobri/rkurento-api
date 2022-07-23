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

export const getSessions = async (ws_url: string) => {
    try {
        const serverManager = await getServerManager(ws_url);
        let kmsSession: Array<kurento.MediaPipeline> = [];
        serverManager.getPipelines().then(
            _sessions => {
                kmsSession = _sessions;
            })
        return kmsSession;
    } catch (error) {
        console.log(error);
    }
}

const initMediaElements = async (pipeline: kurento.MediaPipeline): Promise<[kurento.WebRtcEndpoint,
    kurento.Composite, kurento.HubPort, kurento.HubPort]> => {

    // Create all importants component
    const webRtcEndpoint = await createWebrtcEndpoints(pipeline);
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
        return [webRtcEndpoint, compositeHub, outputVideoPort, outputAudioPort]
    }
}

export const createRoom = async (ws_url: string, websocketId?: string, ws?: WebSocket, sdpOffer?: string): Promise<[string | undefined, string | undefined]> => {
    // Initialize pipeline
    const pipeline = await createMediaPipeline(ws_url);
    try {
        // Create Room with given pipeline ID
        const roomsManager = RoomsManager.getSingleton();
        const [webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort] = await initMediaElements(pipeline);
        const roomId = roomsManager.registerRoom(pipeline, websocketId, webRtcEndpoint, compositeHub, outputAudioPort, outputVideoPort)
        let sdpAnswer = "";

        if (roomId && websocketId) {
            // Add available IceCandidates
            let candidatesQueue = roomsManager.getIceCandidatesQueue(roomId, websocketId);
            if (candidatesQueue) {
                while (candidatesQueue.length) {
                    console.info(JSON.stringify(candidatesQueue, null, 2))
                    var candidate = candidatesQueue.shift();
                    if (candidate) {
                        webRtcEndpoint.addIceCandidate(candidate)
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
                    console.log("Debug Ice", candidate);
                });
                sdpAnswer = await webRtcEndpoint.processOffer(sdpOffer!)
                webRtcEndpoint.gatherCandidates().catch(error => { return error });
            }

        }
        return [roomId, sdpAnswer];

    } catch (error) {
        console.log(error);
        pipeline.release()
        return [undefined, undefined];
    }
}

export const joinRoom = async (ws_url: string, websocketId: string, roomId: string) => {
        }

// stop(sessionId, websocketId);
export const leaveRoom = async (ws_url: string, websocketId: string, roomId: string) => {

// onIceCandidate(sessionId, websocketId, message.candidate)
// onIceCandidate use to addIceCandiate to webRTcEndpoint and Queueing candidate
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
