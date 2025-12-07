"use client";

import React, { useState } from "react";
import { Search, Filter, Trash2, Pencil, Calendar, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { CreateCouponSheet } from "@/components/coupons/create-coupon-sheet";
import { AlertModal } from "@/components/modals/alert-modal";


interface Coupon {
    id: string;
    coupon_code: string;
    discount_amount: number;
    discount_percentage: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
    max_uses: number;
    times_used: number;
    created_at: string;
    description?: string; // Added optional description
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Sheet state
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Delete Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCoupons = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (typeFilter !== "all") params.append("type", typeFilter);
            params.append("sort", sortBy);

            const response = await fetch(`/api/coupons?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch coupons");
            }
            const data = await response.json();
            // Assuming the API returns a list of coupons directly or in a 'items' property
            // Adjust according to actual API response structure if needed. 
            // Based on route.ts proxying, it returns what backend returns.
            // If backend follows FastAPI pagination: { items: [], total: ... }
            const items = Array.isArray(data) ? data : (data.items || []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedItems = items.map((item: any) => ({
                ...item,
                times_used: item.current_uses || 0
            }));
            setCoupons(mappedItems);
        } catch (err) {
            console.error("Error fetching coupons:", err);
            setError("Failed to load coupons. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, typeFilter, sortBy]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchCoupons();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchCoupons]);

    const getStatusParams = (coupon: Coupon) => {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (!coupon.is_active) return { label: "Inactive", variant: "secondary" as const, className: "bg-slate-500/15 text-slate-500 hover:bg-slate-500/25 border-slate-500/20" };
        if (validUntil && now > validUntil) return { label: "Expired", variant: "secondary" as const, className: "bg-slate-500/15 text-slate-500 hover:bg-slate-500/25 border-slate-500/20" };
        if (now < validFrom) return { label: "Scheduled", variant: "outline" as const, className: "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20" };
        return { label: "Active", variant: "default" as const, className: "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20" };
    };

    const getDiscountLabel = (coupon: Coupon) => {
        if (coupon.discount_percentage > 0) return `${coupon.discount_percentage}% Off`;
        return `$${coupon.discount_amount} Off`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleCreate = () => {
        setEditingCoupon(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setIsSheetOpen(true);
    };

    const handleDeleteClick = (coupon: Coupon) => {
        setCouponToDelete(coupon);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!couponToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/coupons/${couponToDelete.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete coupon");
            }

            // Refresh list
            fetchCoupons();
            setIsDeleteModalOpen(false);
            setCouponToDelete(null);
        } catch (error) {
            console.error("Delete error:", error);
            // Optionally show error toast here
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSheetSuccess = () => {
        fetchCoupons();
        // Sheet closing is handled by the sheet component calling onOpenChange(false) 
        // or we can close it here if needed, but existing logic in sheet closes it.
        // Actually, my sheet refactor calls setOpen(false) internally if successful using the prop setter.
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <AlertModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={isDeleting}
                title="Delete Coupon"
                description={`Are you sure you want to delete coupon "${couponToDelete?.coupon_code}"? This action cannot be undone.`}
            />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">
                    Coupons Management
                </h1>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Create New Coupon
                </Button>
                <CreateCouponSheet
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    onSuccess={handleSheetSuccess}
                    coupon={editingCoupon}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by coupon code"
                        className="pl-9 bg-background/50 border-input/60"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background/50 border-input/60">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <span>Status: {statusFilter === 'all' ? 'All' : statusFilter}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Status: All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-background/50 border-input/60">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Type: {typeFilter === 'all' ? 'All' : typeFilter}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Type: All</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-background/50 border-input/60">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <span>Sort By: {sortBy}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Sort By: Newest</SelectItem>
                        <SelectItem value="oldest">Sort By: Oldest</SelectItem>
                        <SelectItem value="usage">Sort By: Usage</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px]">
                                <Checkbox />
                            </TableHead>
                            <TableHead className="font-medium text-foreground">
                                Coupon Code
                            </TableHead>
                            <TableHead className="font-medium text-foreground">
                                Discount
                            </TableHead>
                            <TableHead className="font-medium text-foreground">
                                Start Date
                            </TableHead>
                            <TableHead className="font-medium text-foreground">
                                End Date
                            </TableHead>
                            <TableHead className="font-medium text-foreground">
                                Status
                            </TableHead>
                            <TableHead className="font-medium text-foreground">
                                Usage
                            </TableHead>
                            <TableHead className="text-right font-medium text-foreground">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-red-500">
                                    {error}
                                </TableCell>
                            </TableRow>
                        ) : coupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No coupons found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => {
                                const status = getStatusParams(coupon);
                                return (
                                    <TableRow key={coupon.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <Checkbox />
                                        </TableCell>
                                        <TableCell className="font-medium">{coupon.coupon_code}</TableCell>
                                        <TableCell>{getDiscountLabel(coupon)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(coupon.valid_from)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(coupon.valid_until)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={status.variant}
                                                className={status.className}
                                            >
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {coupon.times_used} / {coupon.max_uses}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                                    onClick={() => handleEdit(coupon)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                                                    onClick={() => handleDeleteClick(coupon)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                {/* Pagination controls can be implemented here based on backend API response metadata */}
                <div className="text-sm text-muted-foreground">
                    {/* Showing 1 to x of y results */}
                </div>
            </div>
        </div>
    );
}
