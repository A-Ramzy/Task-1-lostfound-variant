import Joi from 'joi';
import Item from '../models/Item.js';

// Validation for CREATE — mirrors the schema rules table:
// title required, everything else optional with the same enums/defaults
// the model enforces. Joi checks the shape of the request BEFORE it ever
// touches Mongoose, so bad requests fail fast with a clear 400 instead of
// a raw Mongo validation error.
const createItemSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().allow('', null),
  category: Joi.string().valid(
    'electronics',
    'clothing',
    'documents',
    'accessories',
    'other'
  ),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().allow('', null),
  // reportedBy is a plain optional field — a 24-char hex string is what a
  // Mongo ObjectId looks like as a string over JSON.
  reportedBy: Joi.string().hex().length(24)
});

// For UPDATE, nothing should be force-required — a client might PATCH just
// one field (e.g. only `status`). `.fork` takes the create schema and makes
// `title` optional instead of writing a whole second schema by hand.
const updateItemSchema = createItemSchema.fork(['title'], (field) =>
  field.optional()
);

// CREATE  POST /api/items
export const createItem = async (req, res) => {
  try {
    const { error, value } = createItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const item = await Item.create(value);
    res.status(201).json(item);
  } catch (err) {
    // 11000 = MongoDB duplicate key error, thrown by the compound index
    // on (title, location).
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: 'This item has already been reported at that location.' });
    }
    res.status(500).json({ message: err.message });
  }
};

// READ ALL  GET /api/items
// Stretch: filtering via query string, e.g. ?status=lost&category=electronics
export const getAllItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    // .populate() is a SECOND query under the hood, not a SQL join — Mongoose
    // fetches the items first, collects the reportedBy ids, then runs one
    // more find() against the User collection and stitches the results
    // together client-side. That's why we can select just the fields we
    // want ('name email') instead of pulling the whole user document.
    const items = await Item.find(filter).populate('reportedBy', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// READ ONE  GET /api/items/:id
export const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      'reportedBy',
      'name email'
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE  PUT /api/items/:id
export const updateItem = async (req, res) => {
  try {
    const { error, value } = updateItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const item = await Item.findByIdAndUpdate(req.params.id, value, {
      new: true, // return the document AFTER the update, not before
      runValidators: true // re-run schema validators (enum, required) on update
    });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: 'This item has already been reported at that location.' });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE  DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};