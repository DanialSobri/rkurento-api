"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rk_basic_1 = require("../rk-basic");
describe('RKurento Basic Test', () => {
    const option = {
        log: true,
    };
    after(function () {
        function clearPipeline(mediaPipeline) {
            console.log("release", mediaPipeline.id);
        }
        if (rk_basic_1.m_kurentoClient) {
            rk_basic_1.m_kurentoClient.close();
        }
    });
    it('Create Kurento Pipeline', () => __awaiter(void 0, void 0, void 0, function* () {
        let pipeline = yield (0, rk_basic_1.createMediaPipeline)("ws://167.99.255.24:8888/kurento");
        option.log ? console.log("        Pipeline with ID", pipeline.id, "is created!") :
            (0, chai_1.expect)(pipeline.id).to.not.null;
        pipeline.release();
    }));
    it('Create Kurento WebrtcEndpoint', () => __awaiter(void 0, void 0, void 0, function* () {
        let pipeline = yield (0, rk_basic_1.createMediaPipeline)("ws://167.99.255.24:8888/kurento");
        let webrtcEndpoints = yield (0, rk_basic_1.createWebrtcEndpoints)(pipeline);
        let pipelineMedias = yield pipeline.getChildren();
        option.log ? console.log("        WebRTCEndpoints with ID", webrtcEndpoints.id, "is created!") :
            (0, chai_1.expect)(pipelineMedias.length).equal(1);
        pipeline.release();
    }));
    it('Create Kurento Composite', () => __awaiter(void 0, void 0, void 0, function* () {
        let pipeline = yield (0, rk_basic_1.createMediaPipeline)("ws://167.99.255.24:8888/kurento");
        let composite = yield (0, rk_basic_1.createComposite)(pipeline);
        let pipelineMedias = yield pipeline.getChildren();
        option.log ? console.log("        WebRTCEndpoints with ID", composite.id, "is created!") :
            (0, chai_1.expect)(pipelineMedias.length).equal(1);
        pipeline.release();
    }));
    it('Get Kurento Manager', () => __awaiter(void 0, void 0, void 0, function* () {
        let client = yield (0, rk_basic_1.getKurentoClient)("ws://167.99.255.24:8888/kurento");
        let clientMgr = yield (0, rk_basic_1.getServerManager)("ws://167.99.255.24:8888/kurento");
        let pipelines = yield clientMgr.getPipelines();
        let pipelinesId = pipelines.map(collectID);
        function collectID(mediaPipeline) {
            return mediaPipeline.id;
        }
        option.log ? console.log("        Active Pipelines ID: ", pipelinesId) :
            (0, chai_1.expect)(clientMgr).to.not.null;
    }));
});
