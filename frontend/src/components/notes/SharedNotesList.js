// SharedNotesList.js
import React from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_SHARED_WITH_ME = gql`
  query GetSharedWithMe {
    getSharedWithMe {
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
        email
      }
      sharedWith {
        user {
          id
          name
          email
        }
        permission
      }
    }
  }
`;

const SharedNotesList = () => {
  const { loading, error, data } = useQuery(GET_SHARED_WITH_ME, {
    fetchPolicy: 'network-only'
  });

  if (loading) return <div>Loading shared notes...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📥 Notes Shared With Me</h2>
      
      {data?.getSharedWithMe?.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>👥 No shared notes yet</h3>
          <p>When other users share notes with you, they will appear here.</p>
          <p><strong>💡 Tip:</strong> Ask your teammates to share notes with you using your email</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {data.getSharedWithMe.map(note => (
            <div 
              key={note.id} 
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '2px solid #2ecc71'
              }}
            >
              <h3 style={{ color: '#2c3e50' }}>
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
              
              <div style={{ 
                background: '#e8f6f3', 
                padding: '10px', 
                borderRadius: '5px',
                marginBottom: '10px'
              }}>
                <small>
                  <strong>Shared by:</strong> {note.author.name} ({note.author.email})
                </small>
                <br />
                <small>
                  <strong>Permission:</strong> {note.sharedWith[0]?.permission || 'VIEW'}
                </small>
              </div>
              
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

export default SharedNotesList;