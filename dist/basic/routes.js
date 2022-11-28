"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rkurento_api_1 = require("../RKurentoAPI/rkurento-api");
function default_1(app) {
    // Hello server
    app.get('/', (req, res) => {
        res.send("<h1>Server Condition!</h1>\
          <p>Connect to RKurento MS at \"wss://35.190.197.200:8433/kurento\"⚡</p> \
        ");
    });
    app.get('/rklabs/', (req, res) => {
        (0, rkurento_api_1.getStats)('wss://35.190.197.200:8433/kurento').then(stats => {
            res.send(stats);
        }).catch(error => {
            res.send(error);
        });
    });
}
exports.default = default_1;
