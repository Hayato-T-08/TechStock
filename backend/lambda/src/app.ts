import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import articles from './api/articles/articles';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['https://d19k2r3nvtvw5r.cloudfront.net', 'http://localhost:3000'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
  })
);

app.get('/', (c) => c.text('TechStock API is running'));
app.route('/articles', articles);

export default app;
