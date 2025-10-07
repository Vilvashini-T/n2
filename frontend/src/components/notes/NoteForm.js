import React from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_NOTE } from '../../graphql/mutations';
import { GET_ALL_NOTES } from '../../graphql/queries';
import ShareNoteForm from './ShareNoteForm'; // Import the share form

function NoteForm({ note, isEditing, navigate }) {
    const [deleteNote] = useMutation(DELETE_NOTE, {
        refetchQueries: [{ query: GET_ALL_NOTES }],
        onCompleted: () => {
            navigate('/notes');
        },
        onError: (error) => {
            alert('Failed to delete note: ' + error.message);
        }
    });

    const [showShareForm, setShowShareForm] = React.useState(false);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            await deleteNote({ variables: { id: note.id || note._id } });
        }
    };

    const handleShareClick = () => {
        console.log('📝 Opening share form for note:', note.id || note._id);
        setShowShareForm(true);
    };

    return (
        <form>
            {/* ... your existing form fields ... */}
            
            {isEditing && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={handleShareClick}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors duration-200"
                    >
                        📤 Share Note
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors duration-200"
                    >
                        🗑️ Delete Note
                    </button>
                </div>
            )}

            {/* Share Note Modal */}
            {showShareForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <ShareNoteForm 
                            noteId={String(note.id || note._id)}  // Force string conversion
                            onClose={() => setShowShareForm(false)}  
                        />
                    </div>
                </div>
            )}
        </form>
    );
}

export default NoteForm;