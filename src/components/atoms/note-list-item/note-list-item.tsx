import React from 'react';

export interface NoteListItemProps {
  body: string;
  title: string;
  id: string;
  index: number;
  deleteNote: (id: string) => void;
  openUpdateModal: (title: string, body: string, id: string) => void;
}

export default function NoteListItem({
  body,
  title,
  id,
  index,
  deleteNote,
  openUpdateModal,
}: NoteListItemProps) {
  const cardStyles = [
    'bg-amber-100 border-amber-200',
    'bg-rose-100 border-rose-200',
    'bg-sky-100 border-sky-200',
    'bg-emerald-100 border-emerald-200',
    'bg-violet-100 border-violet-200',
  ];
  return (
    <div
      className={`rounded-2xl border p-4 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${cardStyles[index % cardStyles.length]}`}
    >
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <p className="mt-1 text-slate-700">{body}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => deleteNote(id)}
          className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-500 hover:text-white"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => openUpdateModal(title, body, id)}
          className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-700 hover:text-white"
        >
          Update
        </button>
      </div>
    </div>
  );
}
