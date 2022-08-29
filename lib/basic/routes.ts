import { Express, Request, Response } from 'express';
import {
  getStats,
} from '../RKurentoAPI/rkurento-api';

export default function(app: Express){

    // Hello server
    app.get('/', (req: Request, res: Response) => {
        res.send("<h1>Server Condition!</h1>\
          <p>Connect to RKurento MS at \"wss://35.190.197.200:8433/kurento\"⚡</p> \
        ");
      });

    app.get('/rklabs/', (req: Request, res: Response) => {
        getStats('wss://35.190.197.200:8433/kurento').then(stats => {
          res.send(stats);
        }).catch(error => {
          res.send(error);
        });
    });
    
}
