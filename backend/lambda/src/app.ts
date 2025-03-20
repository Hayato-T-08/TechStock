import { Hono } from 'hono';
import { logger } from 'hono/logger';
import articles from './api/articles/articles';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => c.text('TechStock API is running'));
app.route('/articles', articles);
export default app;
