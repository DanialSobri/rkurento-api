import express, { Express } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './basic/routes';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rkwebsocket from './rk-websocket'
import ip from 'ip';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

/*
 * Management of sessions
 */
const oneDay = 1000 * 60 * 60 * 24
const sessionHandler = session({
  secret: process.env.SECRET_KEY || 'thisismysecrctekeyfhrgfgrfrty84fwir767',
  saveUninitialized: true,
  cookie: { maxAge: oneDay, secure: true },
  resave: false
})
app.use(sessionHandler)
app.use(cookieParser())
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

rkwebsocket(app, sessionHandler);

app.listen(PORT, () => {
  console.log(`Running Restful on http://${ip.address()}:${PORT} ⚡`);
  routes(app);
});