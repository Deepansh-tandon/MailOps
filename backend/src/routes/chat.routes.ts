import { Router } from 'express';
import { streamChat } from '../controllers/chat.controller.js';

const router = Router();

router.post('/stream', streamChat);

export default router;

