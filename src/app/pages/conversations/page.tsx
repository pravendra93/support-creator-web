"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";
import { MessageSquare, User, Bot, Calendar } from "lucide-react";
import { format } from "date-fns";

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

                    // Respect URL tenantId or default to first
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
                    if (data.length > 0) setSelectedConvId(data[0].id);
                    else setSelectedConvId(null);
                }
            } catch (error) {
                console.error("Failed to load conversations", error);
            } finally {
                setIsLoadingConvs(false);
            }
        };
        loadConversations();
    }, [selectedTenantId]);

    // Load Messages
    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedConvId) {
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
    }, [selectedConvId]);

    return (
        <div className="flex flex-col gap-6 p-6 h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor AI chat history and customer interactions.
                    </p>
                </div>

                {tenants.length > 0 && (
                    <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Workspace" />
                        </SelectTrigger>
                        <SelectContent>
                            {tenants.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {!selectedTenantId ? (
                <NoWorkspaceState message="Select a workspace to view conversations." />
            ) : (
                <div className="grid grid-cols-12 gap-6 overflow-hidden flex-1">
                    {/* Conversations List */}
                    <Card className="col-span-4 flex flex-col overflow-hidden">
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg">Recent Chats</CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {conversations.length === 0 && !isLoadingConvs && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No conversations found.
                                    </div>
                                )}
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConvId(conv.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConvId === conv.id
                                            ? "bg-primary/10 border-primary/20 border"
                                            : "hover:bg-muted border border-transparent"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm truncate">
                                                {!conv.user_id || conv.user_id === "guest" ? "Guest User" : `User: ${conv.user_id.substring(0, 8)}`}
                                            </span>
                                            <Badge variant={conv.resolved ? "secondary" : "outline"} className="text-[10px] h-4">
                                                {conv.resolved ? "Resolved" : "Active"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {conv.started_at ? format(new Date(conv.started_at), "MMM d, h:mm a") : "Unknown time"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>

                    {/* Chat View */}
                    <Card className="col-span-8 flex flex-col overflow-hidden">
                        {selectedConvId ? (
                            <>
                                <CardHeader className="border-b py-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-lg">Chat Details</CardTitle>
                                            <CardDescription className="text-xs">ID: {selectedConvId}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-3 ${msg.sender === "user" ? "flex-row" : "flex-row-reverse"}`}
                                            >
                                                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "user" ? "bg-muted" : "bg-primary/10"
                                                    }`}>
                                                    {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                                                </div>
                                                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender === "user"
                                                    ? "bg-muted text-foreground"
                                                    : "bg-primary text-primary-foreground"
                                                    }`}>
                                                    {msg.text}
                                                    <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                                                        {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {messages.length === 0 && !isLoadingMsgs && (
                                            <div className="text-center py-20 text-muted-foreground">
                                                Select a conversation to view messages.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                                <MessageSquare className="h-12 w-12 opacity-20" />
                                <p>Select a conversation from the list to view history.</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function ConversationsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConversationsContent />
        </Suspense>
    );
}
