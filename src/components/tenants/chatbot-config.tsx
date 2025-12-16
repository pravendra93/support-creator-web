"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Copy, Save, MessageSquare, Palette, Code, Check } from "lucide-react"
import { useState, useEffect } from "react"
// We'll assume a toast component exists or just use console for now if not available, 
// but using basic alert/console is safer if we don't know the exact toast lib.
// Let's try to mock a simple toast or use standard alert for simplicity, 
// or check if there is a toaster in the codebase.
// For now, I'll use simple state for feedback.

interface ChatbotConfigData {
    id?: string
    name: string
    welcome_message: string
    is_active: boolean
    primary_color: string
    background_color: string
    logo_url: string
    position: string
}

export function ChatbotConfig({ tenantId }: { tenantId: string }) {
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [config, setConfig] = useState<ChatbotConfigData>({
        name: "Support Assistant",
        welcome_message: "Hi! How can I help you today?",
        is_active: true,
        primary_color: "#000000",
        background_color: "#ffffff",
        logo_url: "",
        position: "bottom-right"
    })

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`/api/tenants/${tenantId}/chatbot`)
                if (res.ok) {
                    const data = await res.json()
                    setConfig({
                        id: data.id,
                        name: data.name || "Support Assistant",
                        welcome_message: data.welcome_message || "Hi! How can I help you today?",
                        is_active: data.is_active ?? true,
                        primary_color: data.primary_color || "#000000",
                        background_color: data.background_color || "#ffffff",
                        logo_url: data.logo_url || "",
                        position: data.position || "bottom-right"
                    })
                }
            } catch (error) {
                console.error("Failed to load chatbot config", error)
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [tenantId])

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch(`/api/tenants/${tenantId}/chatbot`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || "Failed to save")
            }

            setMessage({ type: 'success', text: "Changes saved successfully!" })
            setTimeout(() => setMessage(null), 3000)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Something went wrong" })
        } finally {
            setSaving(false)
        }
    }

    const handleCopy = () => {
        const code = `<script src="https://cdn.supportai.com/widget.js" data-id="${tenantId}"></script>`
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading configuration...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Tabs defaultValue="general" className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
                            <TabsTrigger value="general" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="branding" className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Branding
                            </TabsTrigger>
                            <TabsTrigger value="widget" className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                Widget
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {message && (
                                <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {message.text}
                                </span>
                            )}
                            <Button className="w-full md:w-auto" onClick={handleSave} disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>

                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>
                                    Configure the identity and behavior of your assistant
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Chatbot Name</Label>
                                        <Input
                                            id="name"
                                            value={config.name}
                                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                            className="max-w-md"
                                            placeholder="e.g. Help Bot"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This name will be displayed in the chat header.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between max-w-md bg-muted/50 p-4 rounded-lg border">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="active" className="text-base">Active Status</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Enable or disable the chatbot on your site
                                                </p>
                                            </div>
                                            <Switch
                                                id="active"
                                                checked={config.is_active}
                                                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="welcome">Welcome Message</Label>
                                    <Textarea
                                        id="welcome"
                                        value={config.welcome_message}
                                        onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                                        className="min-h-[100px] max-w-2xl"
                                        placeholder="Enter the first message the user will see..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This message appears automatically when the chat widget is opened.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="branding" className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appearance</CardTitle>
                                    <CardDescription>
                                        Customize colors to match your brand
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Primary Color</Label>
                                            <div className="flex gap-3 items-center">
                                                <div className="relative">
                                                    <Input
                                                        type="color"
                                                        className="h-12 w-12 p-1 rounded-lg cursor-pointer max-w-[50px]"
                                                        value={config.primary_color}
                                                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                                    />
                                                </div>
                                                <Input
                                                    value={config.primary_color}
                                                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                                    className="max-w-[120px] font-mono"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Used for header background and user messages.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Background Color</Label>
                                            <div className="flex gap-3 items-center">
                                                <div className="relative">
                                                    <Input
                                                        type="color"
                                                        className="h-12 w-12 p-1 rounded-lg cursor-pointer max-w-[50px]"
                                                        value={config.background_color}
                                                        onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                                                    />
                                                </div>
                                                <Input
                                                    value={config.background_color}
                                                    onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                                                    className="max-w-[120px] font-mono"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Used for the chat window background.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Assets</CardTitle>
                                    <CardDescription>
                                        Upload logos and icons
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="logo">Logo URL</Label>
                                        <Input
                                            id="logo"
                                            placeholder="https://example.com/logo.png"
                                            value={config.logo_url}
                                            onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Recommended size: 48x48px (PNG or SVG)
                                        </p>
                                    </div>

                                    <div className="mt-4 p-4 border border-dashed rounded-lg flex items-center justify-center bg-muted/20 min-h-[100px]">
                                        <div className="text-center space-y-2">
                                            {config.logo_url ? (
                                                <img src={config.logo_url} alt="Logo Preview" className="h-12 w-12 object-contain mx-auto" />
                                            ) : (
                                                <div className="bg-muted w-12 h-12 rounded-full mx-auto flex items-center justify-center">
                                                    <Palette className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground">Preview Area</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="widget" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Installation</CardTitle>
                                <CardDescription>
                                    Add the chat widget to your website
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="position" className="text-base">Widget Position</Label>
                                    <div className="flex gap-4">
                                        <div
                                            onClick={() => setConfig({ ...config, position: 'bottom-right' })}
                                            className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors w-full max-w-[200px] ${config.position === 'bottom-right' ? 'bg-muted border-primary' : 'hover:bg-muted'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border ${config.position === 'bottom-right' ? 'bg-primary border-primary' : ''}`} />
                                            <span className="text-sm font-medium">Bottom Right</span>
                                        </div>
                                        <div
                                            onClick={() => setConfig({ ...config, position: 'bottom-left' })}
                                            className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors w-full max-w-[200px] ${config.position === 'bottom-left' ? 'bg-muted border-primary' : 'hover:bg-muted'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border ${config.position === 'bottom-left' ? 'bg-primary border-primary' : ''}`} />
                                            <span className="text-sm font-medium">Bottom Left</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base">Embed Code</Label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Copy and paste this code snippet into the <code className="text-xs bg-muted px-1 rounded">&lt;body&gt;</code> of your website.
                                    </p>
                                    <div className="relative group">
                                        <div className="rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-50 overflow-x-auto border border-slate-800 shadow-sm">
                                            {`<script src="https://cdn.supportai.com/widget.js" data-id="${tenantId}"></script>`}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={handleCopy}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Copy Code
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
