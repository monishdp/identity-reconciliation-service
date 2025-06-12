import { Router } from 'express';
import { identifyController } from '../controllers/identityController';

const router = Router();

router.post('/identify', identifyController);

export default router;