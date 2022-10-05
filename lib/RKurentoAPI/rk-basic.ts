// rk-basic.js
// Defining basic implementation of Kurento-Client modules
// Philosophy using async instead of callback spaghetti code 
import kurento, { getSingleton ,Options} from 'kurento-client';

/*
 * Definition of global variables.
 */
export let m_kurentoClient: kurento.ClientInstance;

// kurentoCLient Option
const kurentoClientOption:Options = {
    response_timeout : 30000,
    request_timeout : 20000
}

export const getKurentoClient = async (ws_url: string): Promise<kurento.ClientInstance> => {
    if (m_kurentoClient) {
        return m_kurentoClient;
    }
    m_kurentoClient = await kurento(ws_url,kurentoClientOption);
    return m_kurentoClient;
}

export const createMediaPipeline = async (ws_url: string): Promise<kurento.MediaPipeline> => {
    const kurentoClient = await getKurentoClient(ws_url);
    const mediaPipeline = await kurentoClient!.create('MediaPipeline');
    return mediaPipeline;
}

export const createWebrtcEndpoints = async (mediaPipeline: kurento.MediaPipeline): Promise<kurento.WebRtcEndpoint> => {
    const WebRtcEndpoint = await mediaPipeline.create('WebRtcEndpoint');
    return WebRtcEndpoint;
}

export const createComposite = async (mediaPipeline: kurento.MediaPipeline): Promise<kurento.Composite> => {
    const composite = await mediaPipeline.create('Composite');
    return composite;
}

// Get Composite
export const getServerManager = async (ws_url: string): Promise<kurento.ServerManager> => {
    const serverManager = await (await getKurentoClient(ws_url)).getServerManager();
    return serverManager;
}

