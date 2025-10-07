import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import SearchNotes from './SearchNotes';
import ShareNoteModal from './ShareNoteModal';
import NoteEdit from './NoteEdit';

// ✅ DEFINE THE QUERY FIRST
// In App.js - DEFINE THIS BEFORE NotesList component
const GET_MY_NOTES = gql`
  query GetMyNotes {
    getMyNotes {
      id
      title
      content
      tags
      isPublic
      viewCount
      createdAt
      author {
        id
        name
      }
      sharedWith {
        user {
          id
          name
        }
        permission
      }
    }
  }
`;

// Then your NotesList component...

// Define other mutations (make sure they exist)
const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id) {
      success
      message
    }
  }
`;

const UPDATE_NOTE = gql`
  mutation UpdateNote($id: ID!, $input: UpdateNoteInput!) {
    updateNote(id: $id, input: $input) {
      id
      title
      content
      tags
    }
  }
`;

const SHARE_NOTE_MUTATION = gql`
  mutation ShareNote($noteId: ID!, $email: String!, $permission: String) {
    shareNote(noteId: $noteId, email: $email, permission: $permission) {
      id
      note {
        id
        title
      }
      sharedWith {
        id
        name
      }
    }
  }
`;

// CORRECTED NotesList component
const NotesList = () => {
    console.log('🔍 NotesList component is running from file:', import.meta.url);
  // ✅ ALL HOOKS AT TOP - NO CONDITIONS
  const { loading, error, data, refetch } = useQuery(GET_MY_NOTES, {
    fetchPolicy: 'network-only'
  });

  // ✅ Mutation hooks at top level
  const [deleteNote] = useMutation(DELETE_NOTE, {
    refetchQueries: [{ query: GET_MY_NOTES }],
    onError: (error) => {
      console.error('Error deleting note:', error);
      alert('Failed to delete note: ' + error.message);
    }
  });

  const [updateNote] = useMutation(UPDATE_NOTE, {
    refetchQueries: [{ query: GET_MY_NOTES }],
    onError: (error) => {
      console.error('Error updating note:', error);
      alert('Failed to update note: ' + error.message);
    }
  });

  const [shareNote] = useMutation(SHARE_NOTE_MUTATION, {
    refetchQueries: [{ query: GET_MY_NOTES }],
    onError: (error) => {
      console.error('Error sharing note:', error);
      alert('Failed to share note: ' + error.message);
    }
  });

  // ✅ State hooks at top level
  const [editingNote, setEditingNote] = React.useState(null);
  const [sharingNote, setSharingNote] = React.useState(null);

  // ✅ Handler function for sharing notes
  const handleShare = async (noteId, email) => {
    try {
      const { data } = await shareNote({
        variables: { 
          noteId, 
          email: email,
          permission: 'VIEW'
        }
      });
      
      console.log('✅ Note shared successfully:', data);
      alert('Note shared successfully!');
      setSharingNote(null);
    } catch (error) {
      console.error('Sharing error:', error);
      
      if (error.message.includes('User not found')) {
        alert(`User with email ${email} is not registered. Please ask them to sign up first.`);
      } else {
        alert(`Sharing failed: ${error.message}`);
      }
    }
  };

  // ✅ Early returns AFTER all hooks
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading your notes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          color: 'red', 
          background: '#ffeaa7', 
          padding: '15px', 
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <h3>🚨 Connection Error</h3>
          <p>Unable to connect to the server. Please check:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li>Is the backend server running?</li>
            <li>Check: http://localhost:4001/graphql</li>
            <li>Try refreshing the page</li>
          </ul>
          <button 
            onClick={() => refetch()} 
            style={{ marginTop: '10px', padding: '10px 20px' }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ✅ Other handler functions
  const handleDelete = async (noteId, noteTitle) => {
    if (window.confirm(`Are you sure you want to delete the note "${noteTitle}"?`)) {
      try {
        await deleteNote({ 
          variables: { id: noteId }
        });
        alert('Note deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleSaveEdit = async (noteId, input) => {
    try {
      await updateNote({
        variables: { id: noteId, input }
      });
      setEditingNote(null);
      alert('Note updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Notes</h1>
      <SearchNotes />
      
      {/* Share Modal */}
      {sharingNote && (
        <ShareNoteModal 
          note={sharingNote}
          onClose={() => setSharingNote(null)}
          onShare={handleShare}
        />
      )}
      
      {/* Edit Modal */}
      {editingNote && (
        <NoteEdit 
          note={editingNote}
          onSave={handleSaveEdit}
          onCancel={() => setEditingNote(null)}
        />
      )}
      
      {data?.getMyNotes?.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>No notes yet</h3>
          <p>Create your first note to get started!</p>
          <Link 
            to="/create-note" 
            style={{
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              display: 'inline-block',
              marginTop: '15px'
            }}
          >
            Create Your First Note
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {data?.getMyNotes?.map(note => (
            <div 
              key={note.id} 
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #ecf0f1',
                position: 'relative'
              }}
            >
              {/* Edit Button */}
              <button
                onClick={() => setEditingNote(note)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Edit note"
              >
                ✏️ Edit
              </button>
              
              {/* Share Button */}
              <button
                onClick={() => setSharingNote(note)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '70px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Share note"
              >
                🔗 Share
              </button>
              
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(note.id, note.title)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Delete note"
              >
                🗑️ Delete
              </button>
              
              {/* Shared Indicator */}
              {note.sharedWith && note.sharedWith.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  left: '10px',
                  background: '#e8f4fd',
                  color: '#3498db',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  Shared with {note.sharedWith.length} user{note.sharedWith.length !== 1 ? 's' : ''}
                </div>
              )}
              
              <h3 style={{ marginTop: note.sharedWith && note.sharedWith.length > 0 ? '50px' : '30px', color: '#2c3e50', paddingRight: '60px' }}>
                {note.title}
              </h3>
              <p style={{ 
                color: '#7f8c8d', 
                lineHeight: '1.5',
                marginBottom: '15px',
                whiteSpace: 'pre-wrap'
              }}>
                {note.content}
              </p>
              {note.tags && note.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
                  {note.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      style={{
                        background: '#e8f4fd',
                        color: '#3498db',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#95a5a6',
                borderTop: '1px solid #ecf0f1',
                paddingTop: '10px'
              }}>
                <small>Created: {new Date(parseInt(note.createdAt)).toLocaleDateString()}</small>
                <small>Views: {note.viewCount}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;