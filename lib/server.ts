import express, { Express } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './basic/routes';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rkwebsocket from './rk-websocket'
import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';
import path from 'path';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
/*
 * Management of sessions
 */
const oneDay = 1000 * 60 * 60 * 24
// const sessionHandler = session({
//   secret: process.env.SECRET_KEY || 'thisismysecrctekeyfhrgfgrfrty84fwir767',
//   saveUninitialized: false,
//   cookie: { maxAge: oneDay, secure: true },
//   resave: false
// })
// app.set('trust proxy', 1) // trust first proxy
app.set('port', PORT);
// app.use(sessionHandler)
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const options =
{
    key: process.env.KEY || readFileSync('key/server.key'),
    cert: process.env.CRT || readFileSync('key/server.cert')
}

const WSPORT = process.env.WSPORT || 4040;

const server = https.createServer(options, app).listen(PORT,() => {
  console.log(`Running RKMS Websocket ⚡`);
})

rkwebsocket(server);
// routes(app)
app.use(express.static(path.join(__dirname, '../public')))