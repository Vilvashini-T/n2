import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_NOTES } from '../../graphql/mutations';
import NoteItem from './NoteItem';

const NoteList = () => {
  // ADD THESE DEBUG LOGS
  console.log('🎯 NoteList component is rendering!');
  
  const { loading, error, data } = useQuery(GET_ALL_NOTES);
  
  // ADD THESE LOGS TO SEE WHAT'S HAPPENING
  console.log('📊 NoteList query state:', { loading, error, data });
  console.log('📝 Notes data:', data?.getAllNotes);

  if (loading) {
    console.log('⏳ Still loading...');
    return <div className="text-center py-4">Loading notes...</div>;
  }
  
  if (error) {
    console.log('❌ GraphQL error:', error);
    return <div className="text-center py-4 text-red-500">Error: {error.message}</div>;
  }

  // Check if we have data
  if (!data || !data.getAllNotes) {
    console.log('⚠️ No data received');
    return <div className="text-center py-4 text-yellow-500">No data received from server</div>;
  }

  console.log('✅ Rendering', data.getAllNotes.length, 'notes');

  return (
    <div className="notes-container">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Notes ({data.getAllNotes.length})</h2>
      
      {data.getAllNotes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notes found. Create your first note!
        </div>
      ) : (
        <div className="space-y-4">
          {data.getAllNotes.map(note => {
            console.log('📄 Rendering note:', note._id, note.title);
            return <NoteItem key={note._id} note={note} />;
          })}
        </div>
      )}
    </div>
  );
};

export default NoteList;