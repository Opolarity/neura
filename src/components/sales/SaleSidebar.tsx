import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: number;
  message: string;
  created_at: string;
  user_id: string;
}

interface SaleSidebarProps {
  orderId?: number;
  selectedStatus?: string;
  onStatusChange?: (statusId: string) => void;
}

export const SaleSidebar = ({ orderId, selectedStatus: externalStatus, onStatusChange }: SaleSidebarProps) => {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>(externalStatus || '');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    loadStatuses();
    if (orderId) {
      loadOrderStatus();
      loadNotes();
    }
  }, [orderId]);

  useEffect(() => {
    if (externalStatus) {
      setSelectedStatus(externalStatus);
    }
  }, [externalStatus]);

  const loadStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .order('id');

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const loadOrderStatus = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('order_status')
        .select('status_id')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSelectedStatus(data.status_id.toString());
      }
    } catch (error) {
      console.error('Error loading order status:', error);
    }
  };

  const loadNotes = async () => {
    if (!orderId) return;

    setLoadingNotes(true);
    try {
      const { data: orderNotes, error } = await supabase
        .from('oder_notes')
        .select('note_id')
        .eq('order_id', orderId);

      if (error) throw error;

      if (orderNotes && orderNotes.length > 0) {
        const noteIds = orderNotes.map(on => on.note_id);
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .in('id', noteIds)
          .order('created_at', { ascending: true });

        if (notesError) throw notesError;
        setNotes(notesData || []);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleStatusChange = (statusId: string) => {
    setSelectedStatus(statusId);
    if (onStatusChange) {
      onStatusChange(statusId);
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim()) return;

    if (!orderId) {
      toast({
        title: 'Información',
        description: 'Las notas se guardarán al crear la venta',
      });
      return;
    }

    try {
      // Insert note
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          message: newNote,
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Link note to order
      const { error: orderNoteError } = await supabase
        .from('oder_notes')
        .insert({
          order_id: orderId,
          note_id: noteData.id,
        });

      if (orderNoteError) throw orderNoteError;

      setNewNote('');
      loadNotes();
      
      toast({
        title: 'Nota guardada',
        description: 'La nota se ha guardado correctamente',
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la nota',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Estado del Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estado del Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id.toString()}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notas del Pedido */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Notas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {loadingNotes ? (
                <p className="text-sm text-muted-foreground text-center">Cargando notas...</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No hay notas</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-muted p-3 rounded-lg space-y-1">
                    <p className="text-sm">{note.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(note.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              placeholder="Escribir una nota..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendNote();
                }
              }}
            />
            <Button size="icon" onClick={handleSendNote} disabled={!newNote.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
