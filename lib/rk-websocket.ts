import express, { Express, Request , response, Response} from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import ip from 'ip';

// RKurentoAPI
import { getSessions } from './RKurentoAPI/rkurento-api'

const options =
{
    key: process.env.KEY || readFileSync('keys/server.key'),
    cert: process.env.CRT || readFileSync('keys/server.crt')
}
const WSPORT = process.env.WSPORT || 4040;
const KMSURI = process.env.KMSURI || "ws://167.99.255.24:8888/kurento";

export default function(app: Express, sessionHandler: express.RequestHandler){

    const server = createServer(options, app).listen(WSPORT, () => {
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
    let websocketId : any = null; // differ tabs
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

        case 'stats':
            getSessions(KMSURI).then(value => {
                console.log(KMSURI)
                ws.send(JSON.stringify({
                    id: 'serverStats',
                    message: 'Sucessfully send stats to' + sessionId + "with value" + value
                    }))
            })
            break

        case 'joinRoom':
            sessionId = request.session.id;
            websocketId = request.headers['sec-websocket-key'];
            // start(sessionId, websocketId, ws, message.sdpOffer, true, function(error, sdpAnswer) {
            //     if (error) {
            //         return ws.send(JSON.stringify({
            //             id : 'error',
            //             message : error
            //         }));
            //     }
            //     ws.send(JSON.stringify({
            //         id : 'startResponse',
            //         sdpAnswer : sdpAnswer
            //     }));
            // });
            break;

            case 'leaveRoom':
                sessionId = request.session.id;
                websocketId = request.headers['sec-websocket-key'];
                // start(sessionId, websocketId, ws, message.sdpOffer, true, function(error, sdpAnswer) {
                //     if (error) {
                //         return ws.send(JSON.stringify({
                //             id : 'error',
                //             message : error
                //         }));
                //     }
                //     ws.send(JSON.stringify({
                //         id : 'startResponse',
                //         sdpAnswer : sdpAnswer
                //     }));
                // });
                break;
                
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