// RKurento-api.js
// Main file for RKurento functionalities
import kurento from 'kurento-client';
import { 
    getServerManager,
    createComposite,
    createWebrtcEndpoints,
    createMediaPipeline
} from './rk-basic';
// import { Room }from './rk-room'

export const getSessions = async (ws_url: string) => {
    try {
        const serverManager = await getServerManager(ws_url);
        let kmsSession : Array<kurento.MediaPipeline> = [];
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

export const createMediaElements = async (pipeline : kurento.MediaPipeline, ws_url: string) => {
    try {
        // Create WebRtcEndpoint
        const webRtcEndpoint = await createWebrtcEndpoints(pipeline);
        // Create Composite
        const composite = await createComposite(pipeline);
//        composite.outputVideoPort = await composite.createHubPort();
//        composite.outputAudioPort = await composite.createHubPort();



    } catch (error) {
        console.log(error);
    }
}
