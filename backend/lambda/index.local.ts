import { serve } from '@hono/node-server';
import app from './src/app';

const port = 5555;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

// localで動かす用のファイル
