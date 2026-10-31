import { useState } from "react";
import { PencilLine, Plus, SquarePen, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PromptBlock } from "../../types/chatbotConsiderations.types";

interface Props {
  notes: PromptBlock[];
  disabled: boolean;
  saving: boolean;
  onAdd: (texto: string) => Promise<boolean>;
  onSave: (note: PromptBlock, texto: string) => Promise<boolean>;
  onDelete: (note: PromptBlock) => Promise<boolean>;
}

/**
 * Indicaciones que la tienda le da al bot para esta etapa ("si preguntan por
 * la tela, decir que es algodón 30/1"). Por dentro son párrafos del prompt de
 * origen tienda, en la sección de la etapa.
 */
export const StoreNotesSection = ({ notes, disabled, saving, onAdd, onSave, onDelete }: Props) => {
  const [adding, setAdding] = useState(false);
  const [nuevo, setNuevo] = useState("");

  const agregar = async () => {
    if (!nuevo.trim()) return;
    if (await onAdd(nuevo)) {
      setNuevo("");
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <PencilLine className="h-3.5 w-3.5" />
        Indicaciones de tu tienda
      </p>

      {notes.map((n) => (
        <NoteRow key={n.id} note={n} disabled={disabled || saving} onSave={onSave} onDelete={onDelete} />
      ))}

      {!disabled &&
        (adding ? (
          <div className="flex flex-col gap-2 rounded-md border border-border p-2">
            <Textarea
              rows={3}
              autoFocus
              placeholder="Si preguntan por la tela, decir que es algodón peruano."
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setAdding(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button size="sm" variant="outline" onClick={() => void agregar()} disabled={saving || !nuevo.trim()}>
                Agregar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-left text-sm text-muted-foreground ring-offset-background hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Agregar una indicación para esta etapa
          </button>
        ))}
    </div>
  );
};

const NoteRow = ({
  note,
  disabled,
  onSave,
  onDelete,
}: {
  note: PromptBlock;
  disabled: boolean;
  onSave: (note: PromptBlock, texto: string) => Promise<boolean>;
  onDelete: (note: PromptBlock) => Promise<boolean>;
}) => {
  const [editing, setEditing] = useState(false);
  const [texto, setTexto] = useState(note.content);

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border p-2">
        <Textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={disabled}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || !texto.trim()}
            onClick={async () => {
              if (await onSave(note, texto)) setEditing(false);
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2">
      <p className="whitespace-pre-line text-sm">{note.content}</p>
      {!disabled && (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" title="Editar indicación" onClick={() => setEditing(true)}>
            <SquarePen className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" title="Borrar indicación" onClick={() => void onDelete(note)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
