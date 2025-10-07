// backend/models/SharedNote.js
import mongoose from 'mongoose';

const sharedNoteSchema = new mongoose.Schema({
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    enum: ['VIEW', 'EDIT', 'COMMENT'],
    default: 'VIEW'
  },
  sharedAt: {
    type: Date,
    default: Date.now
  }
});

sharedNoteSchema.index({ sharedWith: 1, sharedAt: -1 });

export default mongoose.model('SharedNote', sharedNoteSchema);