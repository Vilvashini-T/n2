// Add this to your existing NoteForm component
const [deleteNote] = useMutation(DELETE_NOTE, {
  onCompleted: () => {
    // Redirect to notes list after deletion
    navigate('/notes'); // or your notes list route
  },
  onError: (error) => {
    console.error('Error deleting note:', error);
    alert('Failed to delete note: ' + error.message);
  }
});

const handleDelete = async () => {
  if (window.confirm('Are you sure you want to permanently delete this note?')) {
    await deleteNote({ 
      variables: { id: note._id } 
    });
  }
};

// Add this button to your form (when in edit mode)
{isEditing && (
  <button
    type="button"
    onClick={handleDelete}
    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors duration-200"
  >
    Delete Note
  </button>
)}