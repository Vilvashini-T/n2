// frontend/src/App.js - COMPLETE WITH FIXES
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { ApolloProvider, useMutation, useQuery } from '@apollo/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import client from './utils/apolloClient';
// At the top of App.js - CORRECT IMPORTS
// At the top of App.js - CORRECT IMPORTS
import { 
  GET_MY_NOTES,
  SEARCH_NOTES, 
  SEARCH_NOTES_ADVANCED, 
  GET_SHARED_NOTES, 
  GET_NOTE_SHARING_INFO 
} from './graphql/queries';

import { 
  LOGIN, 
  SIGNUP, 
  UPDATE_NOTE, 
  CREATE_NOTE, 
  DELETE_NOTE, 
  TRANSCRIBE_AUDIO,
  UPDATE_NOTE_PERMISSION,
  REMOVE_NOTE_ACCESS
} from './graphql/mutations';

// ENHANCED SpeechToText Component with Auto-Restart
const SpeechToText = ({ onTranscription }) => {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [isSupported, setIsSupported] = React.useState(true);
  const [error, setError] = React.useState('');
  const recognitionRef = React.useRef(null);
  const restartTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const initRecognition = () => {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript);
        
        // Send final transcript to parent component
        if (finalTranscript) {
          onTranscription(finalTranscript.trim());
          // Don't clear interim transcript - keep building
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access to use speech-to-text.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please check your microphone connection.');
        } else if (event.error === 'network') {
          setError('Network error occurred during speech recognition.');
        }
        
        setIsListening(false);
        clearTimeout(restartTimeoutRef.current);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        if (isListening) {
          // Auto-restart after a short delay
          console.log('Auto-restarting speech recognition...');
          restartTimeoutRef.current = setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('Speech recognition restarted');
                setError('');
              } catch (err) {
                console.error('Failed to restart speech recognition:', err);
                setError('Failed to restart speech recognition. Please try again.');
                setIsListening(false);
              }
            }
          }, 100); // Short delay before restart
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setError('');
      };
    };

    initRecognition();

    return () => {
      // Cleanup
      clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log('Recognition already stopped');
        }
      }
    };
  }, [onTranscription]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError('');
      console.log('Started listening...');
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      if (err.message.includes('already started')) {
        // If already started, just update the state
        setIsListening(true);
      } else {
        setError('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('Stopped listening...');
      } catch (err) {
        console.log('Error stopping recognition:', err);
        setIsListening(false);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError('');
  };

  if (!isSupported) {
    return (
      <div style={{ marginBottom: '20px', background: '#fff3cd', padding: '15px', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
        <div style={{ color: '#856404', fontWeight: 'bold', marginBottom: '10px' }}>
          🎤 Speech-to-Text Not Supported
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Your browser doesn't support speech recognition. Try using Chrome, Edge, or Safari.
        </div>
        <button
          type="button"
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => onTranscription('Sample voice note text. Please use a supported browser for real speech-to-text.')}
        >
          Add Sample Text
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      marginBottom: '20px', 
      background: isListening ? '#e8f5e8' : '#f8f9fa', 
      padding: '15px', 
      borderRadius: '5px',
      border: isListening ? '2px solid #28a745' : '1px solid #dee2e6',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: isListening ? '#28a745' : '#495057' }}>
          🎤 {isListening ? '🎙️ Listening... Speak now' : 'Speech-to-Text'}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {transcript && (
            <button
              type="button"
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={clearTranscript}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            style={{
              padding: '8px 16px',
              backgroundColor: isListening ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              minWidth: '120px'
            }}
            onClick={toggleListening}
          >
            {isListening ? '🛑 Stop' : '🎤 Start Speaking'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {transcript && (
        <div style={{
          background: 'white',
          padding: '12px',
          borderRadius: '5px',
          border: '1px solid #dee2e6',
          marginBottom: '10px',
          fontSize: '14px',
          color: '#495057',
          minHeight: '50px',
          lineHeight: '1.4'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#28a745' }}>
            Live Transcript:
          </div>
          {transcript}
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#6c757d', lineHeight: '1.4' }}>
        {isListening ? (
          <>
            <div>● <strong>Recording active</strong> - Speak clearly into your microphone</div>
            <div>● Will auto-restart if interrupted by browser</div>
            <div>● Click "Stop" when you're finished speaking</div>
          </>
        ) : (
          <>
            <div>● Click "Start Speaking" to begin voice recording</div>
            <div>● <strong>Best with Chrome/Edge</strong> - Most reliable speech recognition</div>
            <div>● Ensure microphone permissions are granted</div>
          </>
        )}
      </div>

      {/* Quick sample buttons */}
      {!isListening && (
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
            <strong>Quick samples:</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{
                padding: '6px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={() => onTranscription('Meeting notes: Discussed project timeline and deliverables. Team agreed on Friday deadline for initial review.')}
            >
              Meeting Notes
            </button>
            <button
              type="button"
              style={{
                padding: '6px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={() => onTranscription('Reminder: Buy groceries, call dentist appointment, finish report by end of day, schedule team meeting.')}
            >
              Reminders
            </button>
            <button
              type="button"
              style={{
                padding: '6px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={() => onTranscription('Ideas for the project: Consider implementing dark mode, add export functionality, improve mobile responsiveness.')}
            >
              Project Ideas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
const SharedNotes = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: queryLoading, error, data, refetch } = useQuery(GET_SHARED_NOTES, {
    fetchPolicy: 'network-only',
    skip: !user // Skip query if no user
  });

  // ✅ SAFE USER CHECK
  if (authLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Checking authentication...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          background: '#fff3cd', 
          padding: '20px', 
          borderRadius: '5px',
          border: '1px solid #ffeaa7'
        }}>
          <h3>🔐 Authentication Required</h3>
          <p>Please log in to view shared notes.</p>
          <Link 
            to="/login"
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              display: 'inline-block',
              marginTop: '10px'
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ✅ SAFE DEBUG - Only run if user exists
  console.log('🔍 SharedNotes Debug:');
  console.log('👤 Current user:', user?.email, user?.id);
  console.log('📊 Query loading:', queryLoading);
  console.log('❌ Query error:', error);
  console.log('📝 Query data:', data);
  console.log('📋 Shared notes count:', data?.getSharedNotes?.length);

  const sharedNotes = data?.getSharedNotes || [];
  const [activeTab, setActiveTab] = React.useState('all');

  // Rest of your component remains the same...
  if (queryLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Loading shared notes...</div>
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
          Error loading shared notes: {error.message}
          <button 
            onClick={() => refetch()} 
            style={{ 
              marginLeft: '10px', 
              padding: '5px 10px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter notes based on active tab
  const filteredNotes = sharedNotes.filter(sharedNote => {
    if (activeTab === 'all') return true;
    if (activeTab === 'can-edit') return sharedNote.permission === 'EDIT';
    if (activeTab === 'can-view') return sharedNote.permission === 'VIEW';
    return true;
  });

  const getPermissionBadge = (permission) => {
    const styles = {
      EDIT: { background: '#d4edda', color: '#155724', label: 'Can Edit' },
      VIEW: { background: '#e2e3e5', color: '#383d41', label: 'Can View' },
      COMMENT: { background: '#cce7ff', color: '#004085', label: 'Can Comment' }
    };
    
    const style = styles[permission] || styles.VIEW;
    
    return (
      <span style={{
        background: style.background,
        color: style.color,
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold',
        marginLeft: '8px'
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>📥 Notes Shared With Me</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'all' ? '#3498db' : '#ecf0f1',
              color: activeTab === 'all' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: activeTab === 'all' ? 'bold' : 'normal'
            }}
          >
            All ({sharedNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('can-edit')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'can-edit' ? '#27ae60' : '#ecf0f1',
              color: activeTab === 'can-edit' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: activeTab === 'can-edit' ? 'bold' : 'normal'
            }}
          >
            Can Edit ({sharedNotes.filter(n => n.permission === 'EDIT').length})
          </button>
          <button
            onClick={() => setActiveTab('can-view')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'can-view' ? '#95a5a6' : '#ecf0f1',
              color: activeTab === 'can-view' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: activeTab === 'can-view' ? 'bold' : 'normal'
            }}
          >
            Can View ({sharedNotes.filter(n => n.permission === 'VIEW').length})
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>👥</div>
          <h3 style={{ color: '#7f8c8d', marginBottom: '15px' }}>
            {sharedNotes.length === 0 ? 'No shared notes yet' : 'No notes match your filter'}
          </h3>
          <p style={{ color: '#95a5a6', maxWidth: '400px', margin: '0 auto 25px auto' }}>
            {sharedNotes.length === 0 
              ? 'When other users share notes with you, they will appear here.' 
              : 'Try selecting a different filter to see more notes.'
            }
          </p>
          {sharedNotes.length === 0 && (
            <div style={{ 
              background: '#e8f4fd', 
              padding: '15px', 
              borderRadius: '8px',
              display: 'inline-block',
              textAlign: 'left'
            }}>
              <strong>💡 Tip:</strong> Ask your teammates to share notes with you using your email: 
              <br />
              <code style={{ 
                background: '#d1ecf1', 
                padding: '2px 6px', 
                borderRadius: '3px',
                fontWeight: 'bold',
                marginLeft: '5px'
              }}>
                {JSON.parse(localStorage.getItem('user'))?.email}
              </code>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredNotes.map(sharedNote => (
            <div 
              key={sharedNote.id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '2px solid #e8f4fd',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
              }}
            >
              {/* Shared By Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '1px solid #ecf0f1'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#3498db',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginRight: '10px'
                }}>
                  {sharedNote.sharedBy.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Shared by {sharedNote.sharedBy.name}
                    {getPermissionBadge(sharedNote.permission)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {new Date(parseInt(sharedNote.sharedAt)).toLocaleDateString()} • {sharedNote.sharedBy.email}
                  </div>
                </div>
              </div>

              {/* Note Content */}
              <h3 style={{ 
                color: '#2c3e50', 
                marginBottom: '10px',
                paddingRight: '20px'
              }}>
                {sharedNote.note.title}
              </h3>
              
              <p style={{ 
                color: '#7f8c8d', 
                lineHeight: '1.5',
                marginBottom: '15px',
                whiteSpace: 'pre-wrap',
                fontSize: '14px'
              }}>
                {sharedNote.note.content.substring(0, 150)}
                {sharedNote.note.content.length > 150 && '...'}
              </p>

              {/* Tags */}
              {sharedNote.note.tags && sharedNote.note.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
                  {sharedNote.note.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      style={{
                        background: '#e8f4fd',
                        color: '#3498db',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Note Metadata */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#95a5a6',
                borderTop: '1px solid #ecf0f1',
                paddingTop: '10px'
              }}>
                <div>
                  <small>
                    Created: {new Date(parseInt(sharedNote.note.createdAt)).toLocaleDateString()}
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <small>By: {sharedNote.note.author.name}</small>
                  <small>Views: {sharedNote.note.viewCount}</small>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #ecf0f1'
              }}>
                <button
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  onClick={() => {
                    // Navigate to note view (you can implement this)
                    alert(`Opening note: ${sharedNote.note.title}`);
                  }}
                >
                  📖 Open Note
                </button>
                
                {sharedNote.permission === 'EDIT' && (
                  <button
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    onClick={() => {
                      // Navigate to edit (you can implement this)
                      alert(`Editing note: ${sharedNote.note.title}`);
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const ShareNoteModal = ({ note, onClose, onShare }) => {
  const [email, setEmail] = React.useState('');
  const [permission, setPermission] = React.useState('VIEW');
  const [sharing, setSharing] = React.useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    setSharing(true);

    try {
      // Use GraphQL mutation instead of manual fetch
      const response = await fetch('http://localhost:4001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: `mutation ShareNote($noteId: ID!, $email: String!, $permission: String!) { 
            shareNote(
              noteId: $noteId, 
              email: $email, 
              permission: $permission
            ) { 
              id 
              permission 
              sharedAt
              note {
                id
                title
              }
              sharedWith {
                id
                name
                email
              }
            } 
          }`,
          variables: {
            noteId: note.id,
            email: email,
            permission: permission
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      console.log('✅ Share response:', result.data);
      alert('Note shared successfully!');
      setEmail('');
      setPermission('VIEW');
      onShare(); // Refresh the notes list
      onClose(); // Close the modal
      
    } catch (error) {
      console.error('Sharing error:', error);
      alert(`Sharing failed: ${error.message}`);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Share "{note.title}"</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        </div>

        {/* Share Form */}
        <form onSubmit={handleShare} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Share with Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user's email address"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
              required
            />
            <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
              Enter the email address of the user you want to share with
            </small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Permission Level
            </label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            >
              <option value="VIEW">Can View</option>
              <option value="EDIT">Can Edit</option>
            </select>
            <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
              {permission === 'VIEW' && 'User can only view the note'}
              {permission === 'EDIT' && 'User can view and edit the note'}
            </small>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            disabled={sharing}
          >
            {sharing ? 'Sharing...' : 'Share Note'}
          </button>
        </form>

        {/* Shared With List - Simplified without management */}
        <div>
          <h3 style={{ marginBottom: '15px' }}>Currently Shared With</h3>
          {note.sharedWith && note.sharedWith.length > 0 ? (
            <div style={{ spaceY: '10px' }}>
              {note.sharedWith.map((share, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{share.user?.name || 'Unknown User'}</div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {share.user?.email || 'No email'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#495057', marginTop: '5px' }}>
                    Permission: <strong>{share.permission}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#6c757d',
              background: '#f8f9fa',
              borderRadius: '5px'
            }}>
              This note is not shared with anyone yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error) => {
      console.error('App error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <button onClick={() => window.location.reload()}>
          Reload App
        </button>
      </div>
    );
  }

  return children;
};
// FIXED SearchNotes component - Remove onError from useQuery
const SearchNotes = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [advancedFilters, setAdvancedFilters] = React.useState({
    tags: '',
    dateFrom: '',
    dateTo: '',
    isPublic: null
  });
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ FIXED: Remove onError from useQuery
  const { 
    data: basicSearchData, 
    loading: basicLoading, 
    error: basicError,
    refetch: basicRefetch 
  } = useQuery(SEARCH_NOTES, {
    variables: { query: searchQuery },
    skip: !searchQuery || showAdvanced
  });

  const { 
    data: advancedSearchData, 
    loading: advancedLoading, 
    error: advancedError,
    refetch: advancedRefetch 
  } = useQuery(SEARCH_NOTES_ADVANCED, {
    variables: { 
      input: {
        query: searchQuery || undefined,
        tags: advancedFilters.tags ? advancedFilters.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
        dateFrom: advancedFilters.dateFrom || undefined,
        dateTo: advancedFilters.dateTo || undefined,
        isPublic: advancedFilters.isPublic
      }
    },
    skip: !showAdvanced
  });

  // ✅ Handle errors with useEffect instead of onError
  React.useEffect(() => {
    const error = basicError || advancedError;
    if (error) {
      console.error('Search error:', error);
      setSearchError(error.message);
      
      if (error.message.includes('Not authenticated') || 
          error.message.includes('UNAUTHENTICATED') ||
          error.message.includes('Authentication')) {
        setSearchError('Please log in to search notes');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.networkError) {
        setSearchError('Network error: Unable to connect to server');
      } else {
        setSearchError(`Search failed: ${error.message}`);
      }
    } else {
      setSearchError(null);
    }
  }, [basicError, advancedError, navigate]);

  // Clear error when search query changes
  React.useEffect(() => {
    setSearchError(null);
  }, [searchQuery, showAdvanced]);

  // Rest of your SearchNotes component remains the same...
  const searchResults = showAdvanced ? advancedSearchData?.searchNotesAdvanced : basicSearchData?.searchNotes;
  const loading = basicLoading || advancedLoading;

  const handleBasicSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      await basicRefetch();
    } catch (error) {
      console.error('Search execution error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim() && !advancedFilters.tags.trim() && !advancedFilters.dateFrom && !advancedFilters.dateTo) {
      setSearchError('Please enter at least one search criteria for advanced search');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      await advancedRefetch();
    } catch (error) {
      console.error('Advanced search execution error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAdvancedFilters({
      tags: '',
      dateFrom: '',
      dateTo: '',
      isPublic: null
    });
    setSearchError(null);
  };

  const handleAdvancedFilterChange = (field, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if user is authenticated before rendering search
  if (!user) {
    return (
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2>🔍 Search Notes</h2>
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '5px',
          padding: '15px',
          color: '#856404',
          margin: '20px 0'
        }}>
          <p>⚠️ Please log in to search notes</p>
          <Link 
            to="/login"
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              display: 'inline-block',
              marginTop: '10px'
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h2>🔍 Search Notes</h2>
      <p style={{ color: '#6c757d', marginBottom: '15px' }}>
        Welcome, {user.name}! Search through your notes.
      </p>
      
      {/* Error Display */}
      {searchError && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '5px',
          marginBottom: '15px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {searchError}
          <button
            onClick={() => setSearchError(null)}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Search Form and rest of component remains the same... */}
      <form onSubmit={showAdvanced ? handleAdvancedSearch : handleBasicSearch}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            style={{
              flex: 1,
              padding: '10px',
              border: searchError ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              opacity: (loading || isSearching) ? 0.6 : 1
            }}
            disabled={loading || isSearching}
          >
            {isSearching ? '🔍 Searching...' : 'Search'}
          </button>
        </div>

        {/* Advanced Search Toggle */}
        <button
          type="button"
          onClick={() => {
            setShowAdvanced(!showAdvanced);
            setSearchError(null);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          {showAdvanced ? '▲ Basic Search' : '▼ Advanced Search'}
        </button>

        {/* Advanced Search Options */}
        {showAdvanced && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '15px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Advanced Filters</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={advancedFilters.tags}
                  onChange={(e) => handleAdvancedFilterChange('tags', e.target.value)}
                  placeholder="work, personal, ideas"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                  Visibility
                </label>
                <select
                  value={advancedFilters.isPublic === null ? '' : advancedFilters.isPublic.toString()}
                  onChange={(e) => handleAdvancedFilterChange('isPublic', e.target.value === '' ? null : e.target.value === 'true')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                >
                  <option value="">All Notes</option>
                  <option value="true">Public Only</option>
                  <option value="false">Private Only</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={advancedFilters.dateFrom}
                  onChange={(e) => handleAdvancedFilterChange('dateFrom', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={advancedFilters.dateTo}
                  onChange={(e) => handleAdvancedFilterChange('dateTo', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Rest of the component remains the same... */}
      {(searchQuery || advancedFilters.tags || advancedFilters.dateFrom || advancedFilters.dateTo) && (
        <button
          onClick={clearSearch}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          Clear Search
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#007bff',
          background: '#f8f9fa',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <div>🔍 Searching your notes...</div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && searchResults.length > 0 ? (
        <div>
          <h3 style={{ color: '#495057', marginBottom: '15px' }}>
            Search Results ({searchResults.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {searchResults.map(note => (
              <div 
                key={note.id}
                style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '5px',
                  border: '1px solid #dee2e6',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>{note.title}</h4>
                <p style={{ 
                  color: '#6c757d', 
                  margin: '0 0 10px 0',
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.4'
                }}>
                  {note.content.substring(0, 100)}
                  {note.content.length > 100 && '...'}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {note.tags.map((tag, index) => (
                      <span 
                        key={index}
                        style={{
                          background: '#e9ecef',
                          color: '#495057',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
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
                  color: '#6c757d',
                  borderTop: '1px solid #dee2e6',
                  paddingTop: '10px'
                }}>
                  <span>By: {note.author?.name || 'Unknown'}</span>
                  <span>{new Date(parseInt(note.createdAt)).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery && !loading && !searchError ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          background: '#f8f9fa',
          borderRadius: '5px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
          <h4 style={{ color: '#6c757d', margin: '0 0 10px 0' }}>No notes found</h4>
          <p>Try adjusting your search terms or filters</p>
        </div>
      ) : null}
    </div>
  );
};
// Layout component for authenticated pages - UPDATED WITH SHARED NOTES
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <header style={{
        background: '#2c3e50',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>📝 Notes App</h2>
          <small>Welcome, {user?.name}</small>
        </div>
        <nav style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/dashboard" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/notes" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            📋 My Notes
          </Link>
          <Link 
            to="/shared-notes" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            👥 Shared With Me
          </Link>
          <Link 
            to="/create-note" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✨ New Note
          </Link>
          <button 
            onClick={handleLogout}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
          >
            🚪 Logout
          </button>
        </nav>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};
// ADD THIS COMPONENT IN App.js (before NotesList)
const NoteEdit = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = React.useState(note.title);
  const [content, setContent] = React.useState(note.content);
  const [tags, setTags] = React.useState(note.tags?.join(', ') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(note.id, {
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2>Edit Note</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="10"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontFamily: 'inherit'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
              placeholder="work, personal, ideas"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// CORRECTED NotesList component - FIXED HOOK ORDER
const NotesList = () => {
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

  // ✅ State hooks at top level
  const [editingNote, setEditingNote] = React.useState(null);
  const [sharingNote, setSharingNote] = React.useState(null);

  // ✅ Effect hooks at top level
  React.useEffect(() => {
    if (error) {
      console.error('GraphQL Error:', error);
      console.log('Full error details:', JSON.stringify(error, null, 2));
    }
  }, [error]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

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

  // ✅ Handler functions after hooks and early returns
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
          onShare={refetch}
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
// Create Note Component
function CreateNote() {
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [tags, setTags] = React.useState('');
    const [files, setFiles] = React.useState([]);
    const navigate = useNavigate();

    const [createNote, { loading, error }] = useMutation(CREATE_NOTE, {
        onCompleted: () => {
            navigate('/notes');
        },
        refetchQueries: [{ query: GET_MY_NOTES }]
    });
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
    };

    // In CreateNote component - Update the handleTranscription function
const handleTranscription = (transcript) => {
  setContent(prevContent => {
    const newContent = prevContent ? prevContent + '\n\n' + transcript : transcript;
    
    // Auto-generate title from first few words if title is empty
    if (!title.trim()) {
      const words = transcript.split(' ').slice(0, 5).join(' ');
      setTitle(words + (words.endsWith('...') ? '' : '...'));
    }
    
    return newContent;
  });
};

    const handleSubmit = (e) => {
        e.preventDefault();
        createNote({
            variables: {
                input: {
                    title: title || 'Voice Note ' + new Date().toLocaleDateString(),
                    content,
                    tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                }
            }
        });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Create New Note</h1>

            {/* ADD REAL SPEECH TO TEXT COMPONENT */}

            <form onSubmit={handleSubmit} style={{
                background: 'white',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter note title"
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '16px'
                        }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Attach Files
                    </label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px'
                        }} />
                    {files.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <small>Selected files: {files.map(f => f.name).join(', ')}</small>
                        </div>
                    )}
                </div>
                {/* Speech-to-Text for voice notes */}
                <SpeechToText onTranscription={handleTranscription} />
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your note content here..."
                        rows="10"
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '16px',
                            fontFamily: 'inherit'
                        }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tags (comma separated)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="work, personal, ideas"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '16px'
                        }} />
                </div>

                {error && (
                    <div style={{
                        color: 'red',
                        background: '#ffeaa7',
                        padding: '10px',
                        borderRadius: '5px',
                        marginBottom: '15px'
                    }}>
                        Error: {error.message}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                    <button
                        type="button"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate('/notes')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Note'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Welcome, {user?.name}! 🎉</h1>
      <p>Your Notes App is ready to use.</p>
      
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '20px auto'
      }}>
        <h3>Quick Actions:</h3>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          <Link 
            to="/create-note"
            style={{
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            📝 Create Note
          </Link>
          <Link 
            to="/notes"
            style={{
              padding: '12px 24px',
              backgroundColor: '#2ecc71',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            📋 View Notes
          </Link>
        </div>
      </div>
    </div>
  );
};

// Login Component
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginUser, { loading, error }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      login(data.login.token, data.login.user);
      navigate('/dashboard');
    }
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      await loginUser({ variables: { email, password } });
    } catch (err) {
      // Error handled by the mutation
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Login to Notes App</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input 
            type="email" 
            name="email" 
            placeholder="Enter your email" 
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input 
            type="password" 
            name="password" 
            placeholder="Enter your password" 
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        
        {error && (
          <div style={{ 
            color: 'red', 
            background: '#ffeaa7',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px' 
          }}>
            Error: {error.message}
          </div>
        )}
        
        <button 
          type="submit" 
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

// Signup Component
const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [signup, { loading, error }] = useMutation(SIGNUP, {
    onCompleted: (data) => {
      login(data.signup.token, data.signup.user);
      navigate('/dashboard');
    }
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      await signup({ 
        variables: { 
          input: { name, email, password } 
        } 
      });
    } catch (err) {
      // Error handled by the mutation
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name</label>
          <input 
            type="text" 
            name="name" 
            placeholder="Enter your name" 
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input 
            type="email" 
            name="email" 
            placeholder="Enter your email" 
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input 
            type="password" 
            name="password" 
            placeholder="Enter your password" 
            required 
            minLength="6"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        
        {error && (
          <div style={{ 
            color: 'red', 
            background: '#ffeaa7',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px' 
          }}>
            Error: {error.message}
          </div>
        )}
        
        <button 
          type="submit" 
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

// Home Component - Fixed with loading state and proper redirect
const Home = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
           </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>🎉 Welcome to Notes App!</h1>
      
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        margin: '20px auto'
      }}>
        <h2 style={{ color: '#3498db' }}>Get Started 🚀</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
          Organize your thoughts, ideas, and important information in one place.
        </p>
        
        <div style={{ marginTop: '30px' }}>
          <Link 
            to="/login" 
            style={{ 
              marginRight: '10px',
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            style={{
              padding: '12px 24px',
              backgroundColor: '#2ecc71',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
    console.log('📍 Current path:', window.location.pathname);
  return (
     <ErrorBoundary>
    <ApolloProvider client={client}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notes" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NotesList />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
                  <Route 
                path="/shared-notes" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SharedNotes />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-note" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateNote />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ApolloProvider>
    </ErrorBoundary>
  );
}


export default App;

