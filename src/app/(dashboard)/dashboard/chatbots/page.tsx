"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
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

export default function ChatbotsPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Chatbot Configuration</h1>
                <Button>Save Changes</Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="widget">Widget</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure the basic settings for your chatbot.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">Chatbot Name</Label>
                                <Input id="name" defaultValue="Support Assistant" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="welcome">Welcome Message</Label>
                                <Textarea id="welcome" defaultValue="Hi! How can I help you today?" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="active" defaultChecked />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="branding">
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding</CardTitle>
                            <CardDescription>
                                Customize the look and feel of your chatbot.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="primary-color">Primary Color</Label>
                                    <div className="flex gap-2">
                                        <Input id="primary-color" type="color" className="w-12 h-10 p-1" defaultValue="#000000" />
                                        <Input defaultValue="#000000" className="flex-1" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="bg-color">Background Color</Label>
                                    <div className="flex gap-2">
                                        <Input id="bg-color" type="color" className="w-12 h-10 p-1" defaultValue="#ffffff" />
                                        <Input defaultValue="#ffffff" className="flex-1" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="logo">Logo URL</Label>
                                <Input id="logo" placeholder="https://example.com/logo.png" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="widget">
                    <Card>
                        <CardHeader>
                            <CardTitle>Widget Settings</CardTitle>
                            <CardDescription>
                                Configure how the widget appears on your site.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="position">Position</Label>
                                <select id="position" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Embed Code</Label>
                                <div className="rounded-md bg-muted p-4 font-mono text-sm">
                                    {`<script src="https://cdn.supportai.com/widget.js" data-id="12345"></script>`}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
