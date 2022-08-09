import express, { Express } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './basic/routes';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rkwebsocket from './rk-websocket'
import ip from 'ip';
import { createServer } from 'https';
import { readFileSync } from 'fs';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

/*
 * Management of sessions
 */
const oneDay = 1000 * 60 * 60 * 24
const sessionHandler = session({
  secret: process.env.SECRET_KEY || 'thisismysecrctekeyfhrgfgrfrty84fwir767',
  saveUninitialized: false,
  cookie: { maxAge: oneDay, secure: true },
  resave: false
})
app.set('trust proxy', 1) // trust first proxy
app.use(sessionHandler)
app.use(cookieParser())
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const options =
{
    key: process.env.KEY || readFileSync('key/server.key'),
    cert: process.env.CRT || readFileSync('key/server.cert')
}

const WSPORT = process.env.WSPORT || 4040;

const server = createServer(options,app).listen(WSPORT, () => {
  console.log(`Running Websocket on wss://${ip.address()}:${WSPORT}/rkapi ⚡`);
  console.log(`Running Restful on https://${ip.address()}:${WSPORT} ⚡`);

})

rkwebsocket(app, server ,sessionHandler);
routes(app);