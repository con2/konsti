import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import expressStaticGzip from 'express-static-gzip';
import { Server } from 'http';
import { config } from 'server/config';
import { logger, stream } from 'server/utils/logger';
import { allowCORS } from 'server/middleware/cors';
import { apiRoutes } from 'server/api/apiRoutes';
import { db } from 'server/db/mongodb';

export const startServer = async (
  dbConnString: string,
  port?: number
): Promise<Server> => {
  try {
    await db.connectToDb(dbConnString);
  } catch (error) {
    logger.error(error);
  }

  const server = express();

  server.use(helmet());

  if (config.enableAccessLog) {
    // Set logger
    logger.info("Express: Overriding 'Express' logger");
    server.use(morgan('dev', { stream }));
  }

  // Parse body and populate req.body - only accepts JSON
  server.use(bodyParser.json({ limit: '1000kb', type: '*/*' }));

  server.use(
    '/',
    (err: Error, _req: Request, res: Response, next: NextFunction) => {
      if (err) {
        return res.sendStatus(400);
      } else {
        return next();
      }
    }
  );

  server.use(allowCORS);

  server.use(apiRoutes);

  // Set static path
  const staticPath = path.join(__dirname, '../../', 'front');

  // Set compression
  if (config.bundleCompression) {
    server.use(
      expressStaticGzip(staticPath, {
        enableBrotli: true,
        orderPreference: ['br', 'gz'],
      })
    );
  } else {
    server.use(express.static(staticPath));
  }

  server.get('/*', (_req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  server.set('port', port ?? process.env.PORT);

  const runningServer = server.listen(server.get('port'), () => {
    const address = runningServer?.address();
    if (!address || typeof address === 'string') return;
    logger.info(`Express: Server started on port ${address.port}`);
  });

  return runningServer;
};
