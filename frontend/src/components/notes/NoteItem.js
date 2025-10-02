import React from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_NOTE, GET_ALL_NOTES } from '../../graphql/mutations';

const NoteItem = ({ note }) => {
  console.log('🔍 NoteItem rendering with note:', note);

  const [deleteNote] = useMutation(DELETE_NOTE, {
    refetchQueries: [{ query: GET_ALL_NOTES }],
    onError: (error) => {
      console.error('Error deleting note:', error);
      alert('Failed to delete note: ' + error.message);
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote({ 
          variables: { id: note.id }  // ← CHANGE: note.id instead of note._id
        });
        alert('Note deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="note-item border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{note.title}</h3>
        {/* DELETE BUTTON */}
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-bold"
          title="Delete note"
        >
          🗑️ DELETE
        </button>
      </div>
      
      <p className="text-gray-600 mb-2 whitespace-pre-wrap">{note.content}</p>
      
      {/* Show tags if they exist */}
      {note.tags && note.tags.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-500">Tags: </span>
          {note.tags.map(tag => (
            <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="text-sm text-gray-500 mt-2">
        <span>Views: {note.viewCount}</span>
        <span className="mx-2">•</span>
        <span>Created: {new Date(parseInt(note.createdAt)).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default NoteItem;