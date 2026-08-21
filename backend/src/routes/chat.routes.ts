import { Router } from 'express';
import { streamChat, resumeChat } from '../controllers/chat.controller.js';

const router = Router();

router.post('/stream', streamChat);
router.post('/resume', resumeChat);

export default router;
