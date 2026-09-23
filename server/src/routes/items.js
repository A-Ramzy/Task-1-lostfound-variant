import express from 'express';
import {
  createItem,
  getAllItems,
  getItem,
  updateItem,
  deleteItem
} from '../controllers/itemController.js';

const router = express.Router();

// Standard REST mapping over one resource, /api/items:
// POST   /api/items       -> create
// GET    /api/items       -> list (+ optional ?status=&category= filters)
// GET    /api/items/:id   -> read one
// PUT    /api/items/:id   -> update
// DELETE /api/items/:id   -> delete

router.post('/', createItem);
router.get('/', getAllItems);
router.get('/:id', getItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;