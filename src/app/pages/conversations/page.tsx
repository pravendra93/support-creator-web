"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";
import { MessageSquare, User, Bot, Calendar, Eye, Zap, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";

interface Tenant {
    id: string;
    name: string;
}

interface Conversation {
    id: string;
    session_id: string;
    user_id: string;
    started_at: string;
    resolved: boolean;
    total_credits?: number; // Added field
}

interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
    created_at: string;
}

function ConversationsContent() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingConvs, setIsLoadingConvs] = useState(false);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { user } = useAuth();
    const searchParams = useSearchParams();
    const urlTenantId = searchParams.get('tenantId');

    // Load Tenants
    useEffect(() => {
        const loadTenants = async () => {
            try {
                const res = await fetch("/api/tenants");
                if (res.ok) {
                    const data = await res.json();
                    setTenants(data);

                    if (urlTenantId) {
                        setSelectedTenantId(urlTenantId);
                    } else if (data.length > 0 && !selectedTenantId) {
                        setSelectedTenantId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to load tenants", error);
            }
        };
        if (user) loadTenants();
    }, [user, urlTenantId]);

    // Load Conversations
    useEffect(() => {
        const loadConversations = async () => {
            if (!selectedTenantId) return;
            setIsLoadingConvs(true);
            try {
                const res = await fetch(`/api/conversations?tenant_id=${selectedTenantId}`);
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                }
            } catch (error) {
                console.error("Failed to load conversations", error);
            } finally {
                setIsLoadingConvs(false);
            }
        };
        loadConversations();
    }, [selectedTenantId]);

    // Load Messages when dialog opens
    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedConvId || !isDialogOpen) {
                setMessages([]);
                return;
            };
            setIsLoadingMsgs(true);
            try {
                const res = await fetch(`/api/conversations/${selectedConvId}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("Failed to load messages", error);
            } finally {
                setIsLoadingMsgs(false);
            }
        };
        loadMessages();
    }, [selectedConvId, isDialogOpen]);

    const handleViewChat = (id: string) => {
        setSelectedConvId(id);
        setIsDialogOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title="Conversations"
                description="Monitor AI chat history and customer interactions."
                icon={MessageSquare}
                gradient="from-emerald-500 to-teal-600"
                howItWorks="This page provides a real-time log of all interactions between your AI agent and your customers. You can select a workspace to view its specific history, browse through individual 'Sessions', and see the exact messages exchanged. Use this to audit your bot's behavior, identify common customer questions, and ensure your knowledge base is providing accurate answers."
                actions={tenants.length > 0 && (
                    <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                        <SelectTrigger className="w-[200px] bg-[#13171F] border-white/5 rounded-xl h-12 font-bold shadow-lg">
                            <SelectValue placeholder="Select Workspace" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#13171F] border-white/5 text-white">
                            {tenants.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="cursor-pointer hover:bg-white/5">{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />

            {!selectedTenantId ? (
                <NoWorkspaceState message="Select a workspace to view conversations." />
            ) : (
                <div className="rounded-lg border bg-card shadow-sm mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold text-xs uppercase text-muted-foreground w-[25%]">User</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Started At</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Status</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Credits Used</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingConvs ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : conversations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No conversations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                conversations.map((conv) => (
                                    <TableRow key={conv.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                    <User className="h-5 w-5 text-emerald-500" />
                                                </div>
                                                <div className="grid gap-0.5">
                                                    <div className="font-medium text-sm text-foreground truncate max-w-[200px]">
                                                        {!conv.user_id || conv.user_id === "guest" ? "Guest User" : `User: ${conv.user_id.substring(0, 8)}`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        ID: {conv.id.split('-')[0]}...
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {conv.started_at ? format(new Date(conv.started_at), "MMM d, yyyy h:mm a") : "Unknown time"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={conv.resolved ? "secondary" : "outline"} className="text-xs font-medium">
                                                {conv.resolved ? "Resolved" : "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Zap className="h-3.5 w-3.5 text-indigo-400 fill-current" />
                                                <span className="font-bold text-indigo-400">
                                                    {conv.total_credits?.toLocaleString() || "0"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">credits</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10"
                                                onClick={() => handleViewChat(conv.id)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View Chat
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Chat Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#0A0A0B] border-[#2A2A2B]">
                    <DialogHeader className="p-4 border-b border-[#2A2A2B] bg-[#131314]">
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-emerald-500" />
                            Chat Transcript
                        </DialogTitle>
                        <DialogDescription>
                            Conversation ID: {selectedConvId}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1 p-4 bg-[#0A0A0B]">
                        <div className="space-y-4">
                            {isLoadingMsgs ? (
                                <div className="flex justify-center items-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    No messages found in this conversation.
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 ${msg.sender === "user" ? "flex-row" : "flex-row-reverse"}`}
                                    >
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                            msg.sender === "user" ? "bg-muted" : "bg-primary/10"
                                        }`}>
                                            {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-emerald-500" />}
                                        </div>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                            msg.sender === "user"
                                                ? "bg-[#1E1E20] text-gray-200 rounded-tl-sm"
                                                : "bg-[#163025] text-emerald-100 rounded-tr-sm border border-emerald-900/50"
                                        }`}>
                                            <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                            <div className={`text-[10px] mt-2 opacity-50 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                                                {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ConversationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>}>
            <ConversationsContent />
        </Suspense>
    );
}
