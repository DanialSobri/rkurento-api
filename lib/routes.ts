import { Express, Request, Response } from 'express';

export default function(app: Express){

    // Hello server
    app.get('/', (req: Request, res: Response) => {
        res.send('<h1>Hello server!</h1>');
      });
    
}
