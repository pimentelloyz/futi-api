import 'dotenv/config';

import express from 'express';

import { setupRoutes } from './setup-routes.js';

const app = express();
app.use(express.json());

setupRoutes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 futi-api listening on http://localhost:${port}`);
});
