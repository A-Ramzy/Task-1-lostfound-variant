import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String
    },
    category: {
      type: String,
      enum: ['electronics', 'clothing', 'documents', 'accessories', 'other'],
      default: 'other'
    },
    status: {
      type: String,
      enum: ['lost', 'found', 'claimed'],
      default: 'lost'
    },
    location: {
      type: String
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Same title can't be reported twice at the same location.
// "Unique" here is scoped to the pair (title, location), not title alone —
// two different locations can share a title, and vice versa.
//
// Caveat: if `location` is left blank on two different items with the same
// title, Mongo treats the missing field as equal (null) on both, so the
// second insert will be rejected too. If you want blank-location items to
// NOT collide, switch this to a partial index:
//   itemSchema.index(
//     { title: 1, location: 1 },
//     { unique: true, partialFilterExpression: { location: { $exists: true } } }
//   );
itemSchema.index({ title: 1, location: 1 }, { unique: true });

export default mongoose.model('Item', itemSchema);