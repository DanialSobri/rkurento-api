"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const rk_websocket_1 = __importDefault(require("./rk-websocket"));
const https_1 = require("https");
const fs_1 = require("fs");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
/*
 * Management of sessions
 */
const oneDay = 1000 * 60 * 60 * 24;
const sessionHandler = (0, express_session_1.default)({
    secret: process.env.SECRET_KEY || 'thisismysecrctekeyfhrgfgrfrty84fwir767',
    saveUninitialized: false,
    cookie: { maxAge: oneDay, secure: true },
    resave: false
});
app.set('trust proxy', 1); // trust first proxy
app.use(sessionHandler);
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const options = {
    key: process.env.KEY || (0, fs_1.readFileSync)('key/server.key'),
    cert: process.env.CRT || (0, fs_1.readFileSync)('key/server.cert')
};
const WSPORT = process.env.WSPORT || 4040;
const server = (0, https_1.createServer)(options, app).listen(WSPORT, () => {
    console.log(`Running RKMS Websocket ⚡`);
});
(0, rk_websocket_1.default)(app, server, sessionHandler);
