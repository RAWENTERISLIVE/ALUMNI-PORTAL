import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getLinkedInOAuthUrl, handleLinkedInOAuthCallback, getLinkedInCallbackScript, getLinkedInOAuthStatus } from '../controllers/linkedinController';

const router = express.Router();

router.get('/oauth-url', authMiddleware, getLinkedInOAuthUrl);
router.get('/oauth-status', authMiddleware, getLinkedInOAuthStatus);
router.get('/callback-script.js', getLinkedInCallbackScript);
router.get('/callback', handleLinkedInOAuthCallback);

export default router;
