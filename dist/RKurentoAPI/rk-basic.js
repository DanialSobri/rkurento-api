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
exports.getServerManager = exports.createComposite = exports.createWebrtcEndpoints = exports.createMediaPipeline = exports.getKurentoClient = exports.m_kurentoClient = void 0;
// rk-basic.js
// Defining basic implementation of Kurento-Client modules
// Philosophy using async instead of callback spaghetti code 
const kurento_client_1 = require("kurento-client");
// kurentoCLient Option
const kurentoClientOption = {
    response_timeout: 30000,
    request_timeout: 50000
};
const getKurentoClient = (ws_url) => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.m_kurentoClient) {
        return exports.m_kurentoClient;
    }
    exports.m_kurentoClient = yield (0, kurento_client_1.getSingleton)(ws_url, kurentoClientOption);
    return exports.m_kurentoClient;
});
exports.getKurentoClient = getKurentoClient;
const createMediaPipeline = (ws_url) => __awaiter(void 0, void 0, void 0, function* () {
    const kurentoClient = yield (0, exports.getKurentoClient)(ws_url);
    const mediaPipeline = yield kurentoClient.create('MediaPipeline');
    return mediaPipeline;
});
exports.createMediaPipeline = createMediaPipeline;
const createWebrtcEndpoints = (mediaPipeline) => __awaiter(void 0, void 0, void 0, function* () {
    const WebRtcEndpoint = yield mediaPipeline.create('WebRtcEndpoint');
    return WebRtcEndpoint;
});
exports.createWebrtcEndpoints = createWebrtcEndpoints;
const createComposite = (mediaPipeline) => __awaiter(void 0, void 0, void 0, function* () {
    const composite = yield mediaPipeline.create('Composite');
    return composite;
});
exports.createComposite = createComposite;
// Get Composite
const getServerManager = (ws_url) => __awaiter(void 0, void 0, void 0, function* () {
    const serverManager = yield (yield (0, exports.getKurentoClient)(ws_url)).getServerManager();
    return serverManager;
});
exports.getServerManager = getServerManager;
