// RKurento-api.js
// Main file for RKurento functionalities
import kurento from 'kurento-client';
import { Types } from 'mongoose';
import {
    getServerManager,
    createComposite,
    createWebrtcEndpoints,
    createMediaPipeline
} from './rk-basic';
import {
    createRoomDB,
    updateRoomDB
} from './rk-mongodb';
// import { Room }from './rk-room'

export const getSessions = async (ws_url: string) => {
    try {
        const serverManager = await getServerManager(ws_url);
        let kmsSession: Array<kurento.MediaPipeline> = [];
        serverManager.getPipelines().then(
            _sessions => {
                console.log("Pipelines Session", _sessions);
                kmsSession = _sessions;
            })
        return kmsSession;
    } catch (error) {
        console.log(error);
    }
}

const initMediaElements = async (pipeline: kurento.MediaPipeline, room: Types.ObjectId) => {
    try {
        // Create WebRtcEndpoint
        const webRtcEndpoint = await createWebrtcEndpoints(pipeline);
        // Create Composite
        const composite = await createComposite(pipeline);
        const outputVideoPort = await composite.createHubPort();
        const outputAudioPort = await composite.createHubPort();
        // Update in DB
        await updateRoomDB(room, [], [composite.id, outputVideoPort.id, outputAudioPort.id])
    } catch (error) {
        console.log(error);
    }
}

export const createRoom = async (ws_url: string) => {
    try {
        // Initialize pipeline
        const pipeline = await createMediaPipeline(ws_url);
        // Create Room DB with given pipeline ID
        const createdRoomId = await createRoomDB(pipeline.id);

        if (createdRoomId) {
            // Initialize basic media element in current pipeline
            await initMediaElements(pipeline,createdRoomId);
        }

    } catch (error) {
        console.log(error);
    }
}

