import { Router } from 'express';
import { 
  createHelpTicket, 
  getAllHelpTickets, 
  getMyHelpTickets,
  getHelpTicket, 
  updateHelpTicket, 
  addReplyToTicket, 
  deleteHelpTicket,
  searchHelpTickets
} from '../controllers/helpTicketController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new help ticket
router.post('/', createHelpTicket);

// Get all help tickets (admin only)
router.get('/all', getAllHelpTickets);

// Get my help tickets
router.get('/my', getMyHelpTickets);

// Search help tickets
router.get('/search', searchHelpTickets);

// Get a single help ticket
router.get('/:id', getHelpTicket);

// Update help ticket
router.put('/:id', updateHelpTicket);

// Add reply to ticket
router.post('/:id/reply', addReplyToTicket);

// Delete help ticket
router.delete('/:id', deleteHelpTicket);

export default router;
