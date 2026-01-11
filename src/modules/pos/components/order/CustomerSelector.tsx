import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Client {
    id: number;
    name: string;
    middle_name?: string;
    last_name: string;
    last_name2?: string;
    document_number: string;
    document_type_id: number;
}

interface CustomerSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (client: Client) => void;
}

export const CustomerSelector = ({ isOpen, onClose, onSelect }: CustomerSelectorProps) => {
    const [search, setSearch] = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchClients("");
        }
    }, [isOpen]);

    const fetchClients = async (term: string) => {
        setLoading(true);
        try {
            let query = supabase.from("clients").select("*");
            if (term) {
                query = query.or(`name.ilike.%${term}%,last_name.ilike.%${term}%,document_number.ilike.%${term}%`);
            }
            const { data, error } = await query.limit(10);
            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        fetchClients(val);
    };

    const getFullName = (client: Client) => {
        return [client.name, client.middle_name, client.last_name, client.last_name2]
            .filter(Boolean)
            .join(" ");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-slate-800">Assign Customer</DialogTitle>
                </DialogHeader>

                <div className="px-6 py-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Search by name or document..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition-all"
                        />
                    </div>
                </div>

                <ScrollArea className="h-[300px] px-6 py-4">
                    <div className="space-y-2">
                        {loading && clients.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-sm font-medium">Searching clients...</div>
                        ) : clients.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-sm font-medium">No results found</div>
                        ) : (
                            clients.map((client) => (
                                <div
                                    key={client.id}
                                    onClick={() => onSelect(client)}
                                    className="p-3 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between group"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">
                                            {getFullName(client)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="h-4 text-[9px] px-1 font-bold text-slate-400 bg-white">
                                                DNI: {client.document_number}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                    <Button className="w-full h-11 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl gap-2 shadow-sm transition-all active:scale-[0.98]">
                        <UserPlus className="w-4 h-4" />
                        Quick Create Customer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
