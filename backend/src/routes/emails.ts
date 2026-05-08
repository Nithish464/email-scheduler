import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import {
  scheduleEmailHandler,
  scheduleBulkHandler,
  getScheduledHandler,
  getSentHandler,
  getEmailByIdHandler,
} from '../controllers/emailController';

const router = Router();

router.use(requireAuth);

router.post('/schedule', scheduleEmailHandler);
router.post('/schedule/bulk', scheduleBulkHandler);
router.get('/scheduled', getScheduledHandler);
router.get('/sent', getSentHandler);
router.get('/:id', getEmailByIdHandler);

export default router;
