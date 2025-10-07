import File from '../../models/File.js';
import Note from '../../models/Note.js';
import User from '../../models/User.js';
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import fs from 'fs';
import path from 'path';

import File from '../../models/File.js';
import Note from '../../models/Note.js';
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import path from 'path';

export const fileResolvers = {
  Mutation: {
    uploadFile: async (_, { noteId, file }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = await Note.findById(noteId);
      if (!note) throw new UserInputError('Note not found');
      
      // Check if user has permission to upload to this note
      if (!note.author.equals(user.id) && !note.sharedWith.some(sharedUser => sharedUser.equals(user.id))) {
        throw new AuthenticationError('Not authorized to upload files to this note');
      }
      
      const { filename, mimetype, encoding, createReadStream } = await file;
      
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      if (!allowedMimeTypes.includes(mimetype)) {
        throw new UserInputError('File type not allowed');
      }
  Query: {
    getFilesByNote: async (_, { noteId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = await Note.findById(noteId);
      if (!note) throw new UserInputError('Note not found');
      
      return await File.find({ note: noteId }).populate('uploadedBy');
    },
  },

  Mutation: {
    uploadFile: async (_, { noteId, file }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = await Note.findById(noteId);
      if (!note) throw new UserInputError('Note not found');
      
      // Simple file upload - just save file info to database
      const { filename, mimetype, encoding } = await file;
      
      const fileRecord = new File({
        filename: filename,
        originalName: filename,
        mimetype,
        size: 0, // You can calculate this if needed
        path: `/uploads/${filename}`,
        note: noteId,
        uploadedBy: user.id
      });

      await fileRecord.save();
      await fileRecord.populate('uploadedBy');
      
      return fileRecord;
    },

    deleteFile: async (_, { fileId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const file = await File.findById(fileId);
      if (!file) throw new UserInputError('File not found');

      await File.findByIdAndDelete(fileId);
      return true;
    }
  },

  File: {
    note: async (file) => {
      return await Note.findById(file.note);
    },
    uploadedBy: async (file) => {
      return await User.findById(file.uploadedBy);
    },
  },
};