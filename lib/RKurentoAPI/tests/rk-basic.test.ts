import { expect } from 'chai';
import kurento from 'kurento-client';
import { getKurentoClient,
         getServerManager,
         createMediaPipeline,
         createWebrtcEndpoints,
         createComposite,
         m_kurentoClient
        } from '../rk-basic';

describe('RKurento Basic Test', () => {
    const option = {
        log : true,
    }
    after(function () {

        function clearPipeline(mediaPipeline:kurento.MediaPipeline) {
            console.log("release",mediaPipeline.id)
        }
        if(m_kurentoClient){
            m_kurentoClient.close()
        }
    });
    it('Create Kurento Pipeline', async () => {

        let pipeline = await createMediaPipeline("ws://167.99.255.24:8888/kurento");

        option.log ? console.log("        Pipeline with ID",pipeline.id, "is created!") :
        expect(pipeline.id).to.not.null;

        pipeline.release();
    });
    it('Create Kurento WebrtcEndpoint', async () => {

        let pipeline = await createMediaPipeline("ws://167.99.255.24:8888/kurento");
        let webrtcEndpoints = await createWebrtcEndpoints(pipeline);
        let pipelineMedias = await pipeline.getChildren();

        option.log ? console.log("        WebRTCEndpoints with ID",webrtcEndpoints.id,"is created!") :
        expect(pipelineMedias.length).equal(1);

        pipeline.release();
    });
    it('Create Kurento Composite', async () => {

        let pipeline = await createMediaPipeline("ws://167.99.255.24:8888/kurento");
        let composite = await createComposite(pipeline);
        let pipelineMedias = await pipeline.getChildren();

        option.log ? console.log("        WebRTCEndpoints with ID",composite.id,"is created!") :
        expect(pipelineMedias.length).equal(1);

        pipeline.release();
    });
    it('Get Kurento Manager', async () => {
        
        let client = await getKurentoClient("ws://167.99.255.24:8888/kurento");
        let clientMgr = await getServerManager("ws://167.99.255.24:8888/kurento");
        let pipelines = await clientMgr.getPipelines()
        let pipelinesId = pipelines.map(collectID)

        function collectID(mediaPipeline:kurento.MediaPipeline) {
            return mediaPipeline.id;
        }
        option.log ? console.log("        Active Pipelines ID: ", pipelinesId):
        expect(clientMgr).to.not.null;
    });
});
