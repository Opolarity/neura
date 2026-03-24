import React, { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Paperclip, Send, X } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { addOrderNotes, getOrderNotes } from "../../services";

interface OrderNote {
  name: string | null;
  message: string | null;
  image_url: string | null;
  created_at: string;
}

interface NoteFormValues {
  text: string;
  image: File | null;
  imagePreview: string | null;
}

interface OrderNotesProps {
  orderId: number | null | undefined;
}

const formatNoteDate = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
};

export const OrderNotes = ({ orderId }: OrderNotesProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const noteFileInputRef = useRef<HTMLInputElement>(null);

  const { data: notes = [] } = useQuery<OrderNote[]>({
    queryKey: ["order-notes", orderId],
    queryFn: () => getOrderNotes(orderId!),
    enabled: !!orderId,
  });

  const { register, watch, setValue, handleSubmit, reset } =
    useForm<NoteFormValues>({
      defaultValues: { text: "", image: null, imagePreview: null },
    });

  const text = watch("text");
  const imageFile = watch("image");
  const imagePreview = watch("imagePreview");

  const [isSending, setIsSending] = useState(false);

  const canSend = !!orderId && (text.trim().length > 0 || imageFile !== null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue("image", file);
    setValue("imagePreview", URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeImage = () => {
    setValue("image", null);
    setValue("imagePreview", null);
  };

  const onSubmit = async (values: NoteFormValues) => {
    if (!canSend || !user || !orderId) return;
    setIsSending(true);
    try {
      const updated = await addOrderNotes(
        values.text,
        user.id,
        orderId,
        values.image as any,
      );
      queryClient.setQueryData(["order-notes", orderId], updated ?? []);
      reset();
    } catch {
      toast({
        title: "Error al enviar nota",
        description: "No se pudo guardar la nota. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Notas del Pedido</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Notes list */}
        <ScrollArea className="h-[380px] pr-2">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No hay notas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note, index) => (
                <div
                  key={note.created_at + index}
                  className="bg-muted/50 p-3 rounded-lg"
                >
                  <span className="text-sm font-semibold">
                    {note.name ?? "@bot.neura"}
                  </span>
                  {note.image_url && (
                    <div className="mt-1 w-full">
                      <img
                        src={note.image_url}
                        alt="Imagen adjunta"
                        className="w-full rounded-md object-cover max-h-48"
                      />
                    </div>
                  )}
                  {note.message && (
                    <p className="text-sm mt-1">{note.message}</p>
                  )}
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatNoteDate(note.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Image preview */}
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-16 rounded-md object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5"
              onClick={removeImage}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Input area */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex gap-2 pt-2 border-t"
        >
          <input
            type="file"
            ref={noteFileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "flex-shrink-0",
              !orderId && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => {
              if (!orderId) return;
              noteFileInputRef.current?.click();
            }}
            disabled={!orderId}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Input
            {...register("text")}
            placeholder={
              orderId
                ? "Escribir nota..."
                : "Guarde la venta para agregar notas"
            }
            disabled={!orderId}
            className={cn("flex-1", !orderId && "cursor-not-allowed")}
          />

          <Button
            type="submit"
            size="icon"
            className="flex-shrink-0"
            disabled={!canSend || isSending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
