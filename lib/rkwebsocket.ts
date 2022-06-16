import express, { Express, Request , response, Response} from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import ip from 'ip';

const options =
{
    key: process.env.KEY || readFileSync('keys/server.key'),
    cert: process.env.CRT || readFileSync('keys/server.crt')
}
const WSPORT = process.env.WSPORT || 4040;


export default function(app: Express, sessionHandler: express.RequestHandler){

    const server = createServer(options, app).listen(WSPORT, function(){
        console.log(`Running Websocket on wss://${ip.address()}:${WSPORT}/rkapi ⚡`);
    })
    const wss = new WebSocketServer({
        server,
        path: '/rkapi'
      })
    
    /*
    * Management of WebSocket messages
    */
    wss.on('connection', function (ws, request:Request) {
    let sessionId : string = "";
    const websocketId = null; // differ tabs
    const req = request;
    const res: Response = response.writeHead(200, {});
    
    // Apply session handling
    sessionHandler(req, res, function () {
        sessionId = req.session.id
        console.log('Connection received with sessionId ' + sessionId)
        const websocketId = req.headers['sec-websocket-key']
    })

    ws.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error');
        // stop(sessionId, websocketId)
    })

    ws.on('close', function () {
        console.log('Connection ' + sessionId + ' , ' + websocketId + ' closed');
        // stop(sessionId, websocketId)
    })

    ws.on('message', function (_message : string) {
        const message = JSON.parse(_message)
        console.log('Connection ' + sessionId + ' received message ', message);
        console.log()

        switch (message.id) {
        case 'ping':
            ws.send(JSON.stringify({
            id: 'pong',
            message: 'from RK API Server for client with ' + sessionId
            }))
            break

        default:
            ws.send(JSON.stringify({
            id: 'error',
            message: 'Invalid message ' + message
            }))
            break
        }
    })
    })
      
}