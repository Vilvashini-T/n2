// frontend/src/App.js - COMPLETE WITH FIXES
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { ApolloProvider, useMutation, useQuery } from '@apollo/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import client from './utils/apolloClient';
import { LOGIN, SIGNUP, CREATE_NOTE } from './graphql/mutations';
import { GET_ALL_NOTES } from './graphql/queries';

// Layout component for authenticated pages
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
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/notes" style={{ color: 'white', textDecoration: 'none' }}>My Notes</Link>
          <Link to="/create-note" style={{ color: 'white', textDecoration: 'none' }}>New Note</Link>
          <button 
            onClick={handleLogout}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
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

// Notes List Component
const NotesList = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_NOTES, {
    fetchPolicy: 'network-only'
  });

  React.useEffect(() => {
    refetch();
  }, [refetch]);

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
        <div style={{ color: 'red', background: '#ffeaa7', padding: '15px', borderRadius: '5px' }}>
          Error loading notes: {error.message}
          <button 
            onClick={() => refetch()} 
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Notes</h1>
      
      {data?.getAllNotes?.length === 0 ? (
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
          {data?.getAllNotes?.map(note => (
            <div 
              key={note.id} 
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #ecf0f1'
              }}
            >
              <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{note.title}</h3>
              <p style={{ 
                color: '#7f8c8d', 
                lineHeight: '1.5',
                marginBottom: '15px'
              }}>
                {note.content.substring(0, 150)}
                {note.content.length > 150 && '...'}
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
                <small>Created: {new Date(note.createdAt).toLocaleDateString()}</small>
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
const CreateNote = () => {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [tags, setTags] = React.useState('');
  const navigate = useNavigate();

  const [createNote, { loading, error }] = useMutation(CREATE_NOTE, {
    onCompleted: () => {
      navigate('/notes');
    },
    refetchQueries: [{ query: GET_ALL_NOTES }]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createNote({
      variables: {
        input: {
          title,
          content,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create New Note</h1>
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
            }}
          />
        </div>

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
            }}
          />
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
};

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
              fontWeight: 'bold',
              display: 'inline-block'
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
              fontWeight: 'bold',
              display: 'inline-block'
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
  );
}

export default App;