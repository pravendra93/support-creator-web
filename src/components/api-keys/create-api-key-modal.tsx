"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Key, Copy, Check } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tenant } from "@/types/tenant";

const formSchema = z.z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    tenant_id: z.string().min(1, "Please select a workspace"),
});

interface CreateApiKeyModalProps {
    isOpen: boolean;
    onClose: (createdKey?: string) => void;
    onSuccess: (createdKey?: string) => void;
    initialTenantId?: string | null;
}

export function CreateApiKeyModal({
    isOpen,
    onClose,
    onSuccess,
    initialTenantId,
}: CreateApiKeyModalProps) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            tenant_id: "",
        },
    });

    const fetchTenants = React.useCallback(async () => {
        setIsLoadingTenants(true);
        try {
            const response = await fetch("/api/tenants");
            if (response.ok) {
                const data = await response.json();
                setTenants(data);
            }
        } catch (error) {
            console.error("Failed to fetch tenants:", error);
        } finally {
            setIsLoadingTenants(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchTenants();
            if (initialTenantId) {
                form.setValue("tenant_id", initialTenantId);
            }
        }
    }, [isOpen, initialTenantId, form, fetchTenants]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/api-keys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create API key");
            }

            setCreatedKey(data.full_key || data.key);
            onSuccess(data.full_key || data.key);
        } catch (error) {
            console.error("Error creating API key:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = () => {
        if (createdKey) {
            navigator.clipboard.writeText(createdKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleClose = () => {
        const keyToReturn = createdKey;
        setCreatedKey(null);
        form.reset();
        onClose(keyToReturn || undefined);
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => handleClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{createdKey ? "View API Key" : "Create API Key"}</DialogTitle>
                    <DialogDescription>
                        {createdKey
                            ? "Please copy your API key now. For security reasons, you won't be able to see it again."
                            : "Create a new API key for a workspace."}
                    </DialogDescription>
                </DialogHeader>

                {createdKey ? (
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">API Key</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        readOnly
                                        value={createdKey}
                                        className="pr-10 font-mono text-sm"
                                    />
                                    <Key className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                    className="shrink-0 cursor-pointer"
                                >
                                    {isCopied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={() => handleClose()} className="w-full cursor-pointer">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My API Key" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tenant_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Workspace</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoadingTenants}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a workspace" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {tenants.map((tenant) => (
                                                    <SelectItem key={tenant.id} value={tenant.id}>
                                                        {tenant.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onClose()}
                                    disabled={isSubmitting}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
