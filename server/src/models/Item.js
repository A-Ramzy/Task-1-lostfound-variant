import mongoose from 'mongoose';

// TODO: define the Item schema per README.md section 1.

const itemSchema = new mongoose.Schema(
  {
    // TODO
  },
  { timestamps: true }
);

// TODO: add the uniqueness constraint described in README.md section 1.

export const Item = mongoose.model('Item', itemSchema);
