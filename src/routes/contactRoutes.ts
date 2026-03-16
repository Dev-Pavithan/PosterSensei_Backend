import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import { createContactMessage, getContacts, deleteContact } from '../controllers/contactController';

const router = express.Router();

router.route('/').post(createContactMessage).get(protect, admin, getContacts);
router.route('/:id').delete(protect, admin, deleteContact);

export default router;
