import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import postRoutes from './posts';
import jobRoutes from './jobs';
import eventRoutes from './events';
import groupRoutes from './groups';
import mentorshipRoutes from './mentorship';
import connectionRoutes from './connections';
import commentRoutes from './comments';
import uploadRoutes from './uploads';
import reportRoutes from './reports';
import statusRoutes from './status';

const router = Router();

router.use('/status', statusRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/jobs', jobRoutes);
router.use('/events', eventRoutes);
router.use('/groups', groupRoutes);
router.use('/mentorship', mentorshipRoutes);
router.use('/connections', connectionRoutes);
router.use('/', commentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/reports', reportRoutes);

export default router;
