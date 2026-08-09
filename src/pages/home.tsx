import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import EditNotePopUp from '../components/pages/home/editNotePopUp';
import NoteList from '../components/molecules/note-list/note-list';
import {
  addNote,
  deleteNote as deleteNoteReducer,
  updateNote as updateNoteReducer,
} from '../features/home/slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllNotes } from '../features/home/selectors';

export default function Home() {
  const dispatch = useAppDispatch();

  const [isEditNotePopUpOpen, setIsEditNotePopUpOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState({
    body: '',
    title: '',
    id: '',
  });
  const [submittedNote, setSubmittedNote] = useState({
    body: '',
    title: '',
    id: '',
  });

  const notes = useAppSelector(selectAllNotes);

  const updateNote = (title: string, body: string, id: string) => {
    dispatch(
      updateNoteReducer({
        id,
        title,
        body,
      })
    );
    setIsEditNotePopUpOpen(false);
  };

  const deleteNote = (id: string) => {
    dispatch(
      deleteNoteReducer({
        id,
      })
    );
  };

  const openUpdateModal = (title: string, body: string, id: string) => {
    setSelectedNote({
      title,
      body,
      id,
    });
    setIsEditNotePopUpOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 text-center text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
          📝 My Notes
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(
              addNote({ title: submittedNote.title, body: submittedNote.body, id: uuidv4() })
            );
          }}
          className="mb-10 space-y-4 rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-sm"
        >
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Title
            </label>
            <input
              id="title"
              required
              value={submittedNote.title}
              onChange={(e) => setSubmittedNote({ ...submittedNote, title: e.target.value })}
              placeholder="Give it a title..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label
              htmlFor="body"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Body
            </label>
            <input
              id="body"
              required
              value={submittedNote.body}
              onChange={(e) => setSubmittedNote({ ...submittedNote, body: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98]"
          >
            Add Note
          </button>
        </form>
      </div>
      <NoteList notes={notes} deleteNote={deleteNote} openUpdateModal={openUpdateModal} />
      <EditNotePopUp
        isOpen={isEditNotePopUpOpen}
        setIsOpen={setIsEditNotePopUpOpen}
        updateNote={updateNote}
        editNote={selectedNote}
        setEditNote={setSelectedNote}
      />
    </div>
  );
}
