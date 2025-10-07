import React from 'react';

const ShareNoteForm = ({ noteId, onClose }) => {
  const [email, setEmail] = React.useState('');
  const [permission, setPermission] = React.useState('VIEW');
  const [localError, setLocalError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear everything
    setLocalError(null);
    setIsLoading(true);

    try {
      // Ultra-clean variables
      const cleanNoteId = String(noteId).trim();
      const cleanEmail = String(email).trim();
      const cleanPermission = String(permission);

      console.log('🔄 Manual share attempt:', { cleanNoteId, cleanEmail, cleanPermission });

      // Make request with timeout and full error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://localhost:4001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: `mutation { 
            shareNote(
              noteId: "${cleanNoteId.replace(/"/g, '\\"')}", 
              email: "${cleanEmail.replace(/"/g, '\\"')}", 
              permission: "${cleanPermission}"
            ) { 
              id 
              permission 
            } 
          }`
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log('📦 Raw response text:', text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      console.log('📦 Parsed result:', result);

      if (result.errors && result.errors.length > 0) {
        // Get the first error message
        const firstError = result.errors[0];
        throw new Error(firstError.message || 'GraphQL error occurred');
      }

      if (!result.data || !result.data.shareNote) {
        throw new Error('No share data returned from server');
      }

      console.log('✅ Share successful! Server response:', result.data.shareNote);
      
      // Success - update UI directly
      setLocalError('SUCCESS: Note shared successfully!');
      
      // Reset and close
      setTimeout(() => {
        setEmail('');
        setPermission('VIEW');
        setLocalError(null);
        if (onClose) onClose();
      }, 1000);
      
    } catch (err) {
      console.error('❌ Manual share failed:', err);
      
      // Set clean error message
      let userMessage = 'Sharing failed: ';
      
      if (err.name === 'AbortError') {
        userMessage += 'Request timed out';
      } else if (err.message.includes('JSON')) {
        userMessage += 'Server response error';
      } else if (err.message.includes('status')) {
        userMessage += 'Network error';
      } else {
        userMessage += err.message;
      }
      
      setLocalError(userMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setLocalError(null);
  };

  const handlePermissionChange = (e) => {
    setPermission(e.target.value);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: 'white', 
      borderRadius: '8px', 
      maxWidth: '400px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#2c3e50', textAlign: 'center' }}>
        Share Note
      </h3>
      
      <div style={{ marginBottom: '15px', fontSize: '12px', color: '#7f8c8d', textAlign: 'center' }}>
        Note ID: {String(noteId).substring(0, 20)}...
      </div>
      
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600', 
            color: '#34495e',
            fontSize: '14px'
          }}>
            Email Address:
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: localError ? (localError.startsWith('SUCCESS') ? '1px solid #27ae60' : '1px solid #e74c3c') : '1px solid #bdc3c7', 
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="Enter user's email address"
          />
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600', 
            color: '#34495e',
            fontSize: '14px'
          }}>
            Permission Level:
          </label>
          <select 
            value={permission} 
            onChange={handlePermissionChange}
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #bdc3c7', 
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="VIEW">Can View</option>
            <option value="EDIT">Can Edit</option>
            <option value="COMMENT">Can Comment</option>
          </select>
        </div>
        
        {localError && (
          <div style={{ 
            color: localError.startsWith('SUCCESS') ? '#27ae60' : '#c0392b', 
            background: localError.startsWith('SUCCESS') ? '#d5f4e6' : '#fadbd8', 
            padding: '12px', 
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            border: localError.startsWith('SUCCESS') ? '1px solid #a3e4b9' : '1px solid #f5b7b1',
            textAlign: 'center'
          }}>
            {localError}
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end'
        }}>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading || !email.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: (!email.trim() ? '#bdc3c7' : '#3498db'),
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (!email.trim() ? 'not-allowed' : 'pointer'),
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {isLoading ? 'Sharing...' : 'Share Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShareNoteForm;