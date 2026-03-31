import { Router } from 'express';
import { universalSearch } from '../controllers/searchController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/universal', authMiddleware, universalSearch);

export default router;
