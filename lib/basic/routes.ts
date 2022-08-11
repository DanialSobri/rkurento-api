import { Express, Request, Response } from 'express';
import {
  getStats,
} from '../RKurentoAPI/rkurento-api';

export default function(app: Express){

    // Hello server
    app.get('/', (req: Request, res: Response) => {
        let myStats = getStats(process.env.KMSURI || "")
        res.send("<h1>Server Condition!</h1><p>"+myStats+"</p>");
        // Check if rkms connected
      });
    
}
