import React from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_NOTE } from '../../graphql/mutations';
import { GET_ALL_NOTES } from '../../graphql/queries';

const NoteItem = ({ note }) => {
    // ✅ Hook MUST be called unconditionally at the top
    const [deleteNote] = useMutation(DELETE_NOTE, {
        refetchQueries: [{ query: GET_MY_NOTES }],
        onError: (error) => {
            alert('Failed to delete note: ' + error.message);
        }
    });

    // ✅ Safety check - if note is invalid, return early AFTER hooks
    if (!note) {
        return (
            <div className="note-item bg-yellow-100 border border-yellow-400 p-4 rounded">
                <p className="text-yellow-700">Note data is missing or invalid</p>
            </div>
        );
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNote({ 
                    variables: { 
                        id: note.id || note._id 
                    } 
                });
            } catch (error) {
                console.error('Delete error:', error);
                // Error is already handled by onError in useMutation
            }
        }
    };

    return (
        <div className="note-item border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {note.title || 'Untitled Note'}
            </h3>
            <p className="text-gray-600 mb-4">
                {note.content || 'No content'}
            </p>
            <button 
                onClick={handleDelete} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
                Delete Note
            </button>
        </div>
    );
};

export default NoteItem;