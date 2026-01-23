import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadNoteImage } from '../services';

interface Note {
  id: number;
  message: string;
  created_at: string;
  user_id: string;
  user_name?: string;
  user_last_name?: string;
  image_url?: string;
}

interface SaleSidebarProps {
  orderId?: number;
  selectedSituation?: string;
  onSituationChange?: (situationId: string) => void;
  situations?: any[];
}

export const SaleSidebar = ({ orderId, selectedSituation: externalSituation, onSituationChange, situations }: SaleSidebarProps) => {
  const { toast } = useToast();
  const [selectedSituation, setSelectedSituation] = useState<string>(externalSituation || '');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderId) {
      loadOrderSituation();
      loadNotes();
    }
  }, [orderId]);

  useEffect(() => {
    if (externalSituation) {
      setSelectedSituation(externalSituation);
    }
  }, [externalSituation]);

  const loadOrderSituation = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('order_situations')
        .select('situation_id')
        .eq('order_id', orderId)
        .eq('last_row', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSelectedSituation(data.situation_id.toString());
      }
    } catch (error) {
      console.error('Error loading order situation:', error);
    }
  };

  const loadNotes = async () => {
    if (!orderId) return;

    setLoadingNotes(true);
    try {
      const { data: orderNotes, error } = await (supabase as any)
        .from('order_notes')
        .select('note_id')
        .eq('order_id', orderId);

      if (error) throw error;

      if (orderNotes && orderNotes.length > 0) {
        const noteIds = orderNotes.map((on: any) => on.note_id);
        const { data: notesData, error: notesError } = await (supabase as any)
          .from('notes')
          .select(`
            *,
            profiles:user_id (
              account_id,
              accounts:account_id (
                name,
                last_name
              )
            )
          `)
          .in('id', noteIds)
          .order('created_at', { ascending: true });

        if (notesError) throw notesError;
        
        // Transform data to include user info
        const notesWithUserInfo = notesData?.map((note: any) => ({
          ...note,
          user_name: note.profiles?.accounts?.name,
          user_last_name: note.profiles?.accounts?.last_name
        })) || [];
        
        setNotes(notesWithUserInfo);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSituationChange = (situationId: string) => {
    setSelectedSituation(situationId);
    
    if (onSituationChange) {
      onSituationChange(situationId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Archivo no válido',
          description: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP) y archivos PDF',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim() && !selectedFile) return;

    if (!orderId) {
      toast({
        title: 'Información',
        description: 'Las notas se guardarán al crear la venta',
      });
      return;
    }

    setUploading(true);
    try {
      // 1. Insert note without image first to get the note_id
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          message: newNote.trim() || 'Archivo adjunto',
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // 2. If there's a file, upload it using the note_id and order_id
      if (selectedFile && noteData) {
        const imageUrl = await uploadNoteImage(orderId, noteData.id, selectedFile);
        
        // 3. Update the note with the image_url
        const { error: updateError } = await supabase
          .from('notes')
          .update({ image_url: imageUrl })
          .eq('id', noteData.id);

        if (updateError) throw updateError;
      }

      // 4. Link note to order
      const { error: orderNoteError } = await (supabase as any)
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_id: noteData.id,
        });

      if (orderNoteError) throw orderNoteError;

      setNewNote('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    } finally {
      setUploading(false);
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
          <Select value={selectedSituation} onValueChange={handleSituationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {situations?.map((situation) => (
                <SelectItem key={situation.id} value={situation.id.toString()}>
                  {situation.name}
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
                  <div key={note.id} className="bg-muted p-3 rounded-lg space-y-2">
                    {note.message && <p className="text-sm">{note.message}</p>}
                    {note.image_url && (
                      <div className="mt-2">
                        {note.image_url.endsWith('.pdf') ? (
                          <a
                            href={note.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            Ver PDF
                          </a>
                        ) : (
                          <a href={note.image_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={note.image_url}
                              alt="Adjunto"
                              className="max-w-full h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ maxHeight: '200px' }}
                            />
                          </a>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {note.user_name && note.user_last_name 
                          ? `${note.user_name} ${note.user_last_name}` 
                          : 'Usuario desconocido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(note.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="space-y-2">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={removeSelectedFile}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
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
                disabled={uploading}
              />
              <Button
                size="icon"
                onClick={handleSendNote}
                disabled={(!newNote.trim() && !selectedFile) || uploading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
