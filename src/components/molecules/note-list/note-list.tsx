import React from 'react';
import { Note } from '../../../utils/types';
import NoteListItem from '../../atoms/note-list-item/note-list-item';

export interface NoteListProps {
  notes: Note[];
  deleteNote: (id: string) => void;
  openUpdateModal: (title: string, body: string, id: string) => void;
}

export default function NoteList({ notes, deleteNote, openUpdateModal }: NoteListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {notes.map(({ title, body, id }, index) => (
        <NoteListItem
          key={id}
          index={index}
          title={title}
          body={body}
          id={id}
          deleteNote={deleteNote}
          openUpdateModal={openUpdateModal}
        />
      ))}
    </div>
  );
}
