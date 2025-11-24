import 'dotenv/config';

import { app } from './app.js';

const port = Number(process.env.PORT) || 3000;
// Em produção usa 0.0.0.0 (Cloud Run), em dev usa localhost
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(port, host, () => {
  console.log(`🚀 futi-api listening on http://${host}:${port}`);
});
