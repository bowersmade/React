import React from 'react';
import { Note } from '../../../utils/types';
import PopUpModal from '../../atoms/pop-up-modal/pop-up-modal';

export interface EditNotePopUpProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateNote: (title: string, body: string, id: string) => void;
  editNote: Note;
  setEditNote: React.Dispatch<React.SetStateAction<Note>>;
}

export default function EditNotePopUp({
  isOpen,
  setIsOpen,
  updateNote,
  editNote,
  setEditNote,
}: EditNotePopUpProps) {
  const onClose = () => {
    setIsOpen(false);
  };

  return isOpen ? (
    <PopUpModal onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Edit note</h2>
          <button
            type="button"
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={() => onClose()}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="pop-up-title"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Title
            </label>
            <input
              id="pop-up-title"
              value={editNote.title}
              onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label
              htmlFor="pop-up-body"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Body
            </label>
            <input
              id="pop-up-body"
              value={editNote.body}
              onChange={(e) => setEditNote({ ...editNote, body: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onClose()}
            className="rounded-lg px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => updateNote(editNote.title, editNote.body, editNote.id)}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98]"
          >
            Save changes
          </button>
        </div>
      </div>
    </PopUpModal>
  ) : null;
}
