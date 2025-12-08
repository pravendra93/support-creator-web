"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormDescription,
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
import { Textarea } from "@/components/ui/textarea";

// Define schema matching the API JSON structure requirement
const formSchema = z.object({
    coupon_code: z
        .string()
        .min(3, { message: "Coupon code must be at least 3 characters." })
        .max(20, { message: "Coupon code must be at most 20 characters." })
        .regex(/^[A-Z0-9]+$/, {
            message: "Code must be alphanumeric and uppercase.",
        }),
    description: z.string().optional(),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.coerce
        .number()
        .min(1, { message: "Value must be at least 1." }),
    max_uses: z.coerce
        .number()
        .min(1, { message: "Max uses must be at least 1." }),
});

type FormValues = z.infer<typeof formSchema>;

// Define a minimal coupon interface for the sheet
interface CouponData {
    id: string;
    coupon_code: string;
    description?: string;
    discount_amount: number;
    discount_percentage: number;
    max_uses: number;
}

interface Props {
    onSuccess?: () => void;
    coupon?: CouponData | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreateCouponSheet({ onSuccess, coupon, open: controlledOpen, onOpenChange: setControlledOpen }: Props) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const form = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            coupon_code: "",
            description: "",
            discount_type: "percentage",
            discount_value: 0,
            max_uses: 100,
        },
    });

    // Reset form when coupon prop changes (for editing) or when sheet opens/closes
    useEffect(() => {
        if (open) {
            if (coupon) {
                form.reset({
                    coupon_code: coupon.coupon_code,
                    description: coupon.description || "",
                    discount_type: coupon.discount_percentage > 0 ? "percentage" : "fixed",
                    discount_value: coupon.discount_percentage > 0 ? coupon.discount_percentage : coupon.discount_amount,
                    max_uses: coupon.max_uses,
                });
            } else {
                form.reset({
                    coupon_code: "",
                    description: "",
                    discount_type: "percentage",
                    discount_value: 0,
                    max_uses: 100,
                });
            }
        }
    }, [coupon, open, form]);

    const onSubmit = async (values: FormValues) => {
        if (values.discount_type === "percentage" && values.discount_value > 100) {
            form.setError("discount_value", {
                type: "manual",
                message: "Percentage discount cannot exceed 100%.",
            });
            return;
        }

        setIsLoading(true);

        const payload = {
            coupon_code: values.coupon_code,
            description: values.description || "",
            discount_amount:
                values.discount_type === "fixed" ? values.discount_value : 0,
            discount_percentage:
                values.discount_type === "percentage" ? values.discount_value : 0,
            max_uses: values.max_uses,
        };

        try {
            const url = coupon ? `/api/coupons/${coupon.id}` : "/api/coupons";
            const method = coupon ? "PATCH" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    form.setError("coupon_code", {
                        type: "manual",
                        message: "Unauthorized. Please log in again.",
                    });
                } else {
                    form.setError("coupon_code", {
                        type: "manual",
                        message: data.message || "Failed to save coupon.",
                    });
                }
                return;
            }

            if (setOpen) setOpen(false);
            if (!coupon) form.reset(); // Only reset if creating, though the useEffect handles it too

            if (onSuccess) {
                onSuccess();
            }

        } catch (error) {
            console.error("Failed to save coupon:", error);
            form.setError("coupon_code", {
                type: "manual",
                message: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <SheetTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" /> Create New Coupon
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{coupon ? "Edit Coupon" : "Create New Coupon"}</SheetTitle>
                    <SheetDescription>
                        {coupon
                            ? "Update the details of the existing coupon."
                            : "Create a new coupon code for your customers."}
                        Click save when you&apos;re done.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col h-full"
                    >
                        <div className="space-y-6 px-4 mt-6">
                            <FormField
                                control={form.control}
                                name="coupon_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coupon Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="SUMMER24" {...field} disabled={!!coupon} />
                                        </FormControl>
                                        <FormDescription>
                                            Unique code for the coupon (uppercase alphanumeric). {coupon && "Cannot be changed."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Summer sale discount code..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="discount_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            // defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="discount_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Value</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="max_uses"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Uses</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Maximum number of times this coupon can be used.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>
                        <SheetFooter className="mt-6 sm:justify-end pb-6">
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? (coupon ? "Updating..." : "Creating...") : (coupon ? "Update Coupon" : "Create Coupon")}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
