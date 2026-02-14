'use client';

import { useState, useEffect } from 'react';
import { ContextNote } from '@/types';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ContextTab() {
  const [notes, setNotes] = useState<ContextNote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<ContextNote | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'contextNotes'), orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ContextNote[];

      setNotes(notesData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingNote) {
        const noteRef = doc(db, 'contextNotes', editingNote.id);
        await updateDoc(noteRef, {
          ...formData,
          updatedAt: Timestamp.now(),
        });
        setEditingNote(null);
      } else {
        await addDoc(collection(db, 'contextNotes'), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      setFormData({ title: '', content: '', category: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleEdit = (note: ContextNote) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      await deleteDoc(doc(db, 'contextNotes', noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setFormData({ title: '', content: '', category: '' });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#e8e6e3]">Context & Knowledge Base</h2>
            <p className="text-sm text-[#a8a6a3] mt-1">
              Add important context, docs, and notes that AI can reference
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-[#d4a843] text-[#0a0a0f] rounded font-medium hover:bg-[#c49833] transition text-sm"
          >
            {showAddForm ? 'Cancel' : '+ Add Note'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-[#0a0a0f] rounded border border-[#2a2a2f] space-y-4">
            <div>
              <label className="block text-sm text-[#a8a6a3] mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
                placeholder="e.g., Product Philosophy, User Feedback, Market Research"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a8a6a3] mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
                placeholder="e.g., Strategy, Documentation, Insights"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a8a6a3] mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843] resize-none font-mono"
                rows={8}
                placeholder="Add detailed context, documentation, insights, or any information the AI should know..."
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-[#d4a843] text-[#0a0a0f] rounded font-medium hover:bg-[#c49833] transition text-sm"
              >
                {editingNote ? 'Update Note' : 'Save Note'}
              </button>
              {editingNote && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-[#2a2a2f] text-[#e8e6e3] rounded font-medium hover:bg-[#3a3a3f] transition text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {notes.length === 0 ? (
          <div className="text-center py-12 text-[#6a6a6f]">
            <p>No context notes yet.</p>
            <p className="text-sm mt-2">
              Add knowledge, docs, and insights that AI can reference when giving suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-[#0a0a0f] border border-[#2a2a2f] rounded hover:border-[#3a3a3f] transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-[#e8e6e3] mb-1">{note.title}</h3>
                    <span className="inline-block px-2 py-0.5 bg-[#d4a843]/20 text-[#d4a843] rounded text-xs">
                      {note.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="text-xs text-[#a8a6a3] hover:text-[#e8e6e3] transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#a8a6a3] whitespace-pre-wrap font-mono bg-[#1a1a1f] p-3 rounded border border-[#2a2a2f] max-h-48 overflow-y-auto">
                  {note.content}
                </p>

                <div className="mt-2 text-xs text-[#6a6a6f]">
                  Updated {note.updatedAt.toLocaleDateString()} at{' '}
                  {note.updatedAt.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
