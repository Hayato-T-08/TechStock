import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import articles from './api/articles/articles';
import fetchQiita from './api/fetchQiita/fetchQiita';

const app = new Hono();

// CORSミドルウェアを追加
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL || '*'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
);

app.use('*', logger());

app.get('/', (c) => c.text('TechStock API is running'));
app.route('/api/articles', articles);
app.route('/api/fetchQiita', fetchQiita);

export default app;
