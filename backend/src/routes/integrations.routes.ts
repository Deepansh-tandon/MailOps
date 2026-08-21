import { Router } from 'express';
import {
  connectIntegration,
  getIntegrations,
} from '../controllers/integrations.controller.js';

const router = Router();

router.get('/', getIntegrations);
router.post('/connect', connectIntegration);

export default router;
