import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import routes from './routes/index.js';
import './config/database.js';
import { sequelize } from './models/index.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(bodyParser.json());

// Rotas
app.use('/api', routes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Endpoint não encontrado' }));

sequelize.sync();

export default app;
