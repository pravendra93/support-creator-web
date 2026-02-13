"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ChatbotSettings {
    name: string;
    welcome_message: string;
    is_active: boolean;
    primary_color: string;
    background_color: string;
    position: string;
}

interface ApiKeyItem {
    id: string;
    name: string;
    key: string;
    is_active: boolean;
}

interface ChatBotConfigProps {
    tenantId: string;
}

export function ChatBotConfig({ tenantId }: ChatBotConfigProps) {
    const [settings, setSettings] = useState<ChatbotSettings>({
        name: "Support Assistant",
        welcome_message: "Hi! How can I help you today?",
        is_active: true,
        primary_color: "#000000",
        background_color: "#ffffff",
        position: "bottom-right"
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
    const [selectedApiKey, setSelectedApiKey] = useState<string>("");
    const [isLoadingKeys, setIsLoadingKeys] = useState(false);
    const [isSnippetCopied, setIsSnippetCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/chatbots/tenants/${tenantId}/chatbot`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [tenantId]);

    // Fetch API keys for the tenant
    useEffect(() => {
        const fetchApiKeys = async () => {
            setIsLoadingKeys(true);
            try {
                const res = await fetch("/api/api-keys");
                if (res.ok) {
                    const data = await res.json();
                    const keys: ApiKeyItem[] = Array.isArray(data) ? data : (data.items || []);
                    // Filter only active keys for this tenant
                    const tenantKeys = keys.filter(
                        (k: ApiKeyItem) => k.is_active
                    );
                    setApiKeys(tenantKeys);
                    if (tenantKeys.length > 0) {
                        setSelectedApiKey(tenantKeys[0].key);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch API keys:", error);
            } finally {
                setIsLoadingKeys(false);
            }
        };
        fetchApiKeys();
    }, [tenantId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/chatbots/tenants/${tenantId}/chatbot`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                toast({
                    title: "Settings saved",
                    description: "Chatbot configuration updated successfully.",
                });
            } else {
                throw new Error("Failed to save settings");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update chatbot configuration.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getIntegrationSnippet = () => {
        if (typeof window === "undefined") return "";
        return `<script 
  src="${window.location.protocol}//${window.location.host}/widget.js" 
  data-api-key="${selectedApiKey}"
  async>
</script>`;
    };

    const handleCopySnippet = () => {
        navigator.clipboard.writeText(getIntegrationSnippet());
        setIsSnippetCopied(true);
        setTimeout(() => setIsSnippetCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Appearance & Behavior</CardTitle>
                    <CardDescription>Customize how your chatbot looks and greets your users.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="bot-name">Bot Name</Label>
                        <Input
                            id="bot-name"
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="welcome-msg">Welcome Message</Label>
                        <Textarea
                            id="welcome-msg"
                            value={settings.welcome_message}
                            onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                            placeholder="Type a message to greet your users..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="primary-color">Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="primary-color"
                                    type="color"
                                    className="w-12 p-1 h-10"
                                    value={settings.primary_color}
                                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                />
                                <Input
                                    value={settings.primary_color}
                                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bg-color">Background Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="bg-color"
                                    type="color"
                                    className="w-12 p-1 h-10"
                                    value={settings.background_color}
                                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                                />
                                <Input
                                    value={settings.background_color}
                                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Chatbot</Label>
                            <p className="text-xs text-muted-foreground">Show the chat widget on your website.</p>
                        </div>
                        <Switch
                            checked={settings.is_active}
                            onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
                        />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-blue-100 bg-blue-50/50">
                <CardHeader>
                    <CardTitle className="text-blue-900">Integration Code</CardTitle>
                    <CardDescription className="text-blue-700">Add this script to your website's header or footer to enable the chatbot.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {/* API Key Selector */}
                    <div className="grid gap-2">
                        <Label className="text-blue-900 font-medium">Select API Key</Label>
                        {isLoadingKeys ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading API keys...
                            </div>
                        ) : apiKeys.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>No active API keys found. Please create an API key first from the <strong>API Keys</strong> page.</span>
                            </div>
                        ) : (
                            <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                                <SelectTrigger className="bg-white border-blue-200">
                                    <SelectValue placeholder="Select an API key" />
                                </SelectTrigger>
                                <SelectContent>
                                    {apiKeys.map((key) => (
                                        <SelectItem key={key.id} value={key.key}>
                                            {key.name} ({key.key.slice(0, 8)}...{key.key.slice(-4)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Code Snippet */}
                    {selectedApiKey && (
                        <div className="relative">
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-[11px] pr-12">
                                {getIntegrationSnippet()}
                            </pre>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
                                onClick={handleCopySnippet}
                                title="Copy snippet"
                            >
                                {isSnippetCopied ? (
                                    <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

