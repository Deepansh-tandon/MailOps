import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import chatRoutes from './routes/chat.routes.js';
import authRoutes from './routes/auth.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});

