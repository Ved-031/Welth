"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ClockIcon, MoreHorizontalIcon, RefreshCwIcon, SearchIcon, TrashIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Transaction } from "@prisma/client";
import { categoryColors } from "@/lib/categories";
import { BulkDeleteTransactions } from "@/actions/transaction";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


interface TransactionTableProps {
    transactions: Transaction[];
}

const RECURRING_INTERVALS = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    YEARLY: "Yearly",
}
const ITEMS_PER_PAGE = 10;

export const TransactionTable = ({ transactions }: TransactionTableProps) => {

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState({
        field: "date" as "date" | "category" | "amount",
        direction: "desc" as "asc" | "desc",
    });
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [recurringFilter, setRecurringFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions];
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter((item) => item.description?.toLowerCase().includes(searchLower));
        }
        if (recurringFilter) {
            result = result.filter((item) => {
                if (recurringFilter === "recurring") return item.isRecurring;
                return !item.isRecurring;
            });
        }
        if (typeFilter) {
            result = result.filter((item) => item.type === typeFilter);
        }
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortConfig.field) {
                case "date":
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case "category":
                    comparison = a.category.localeCompare(b.category);
                    break;
                case "amount":
                    comparison = parseFloat(a.amount.toString()) - parseFloat(b.amount.toString());
                    break;
                default:
                    comparison = 0;
            }

            return sortConfig.direction === "asc" ? comparison : -comparison;
        })
        return result;
    }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredAndSortedTransactions.slice(startIndex, endIndex);
    }, [filteredAndSortedTransactions, currentPage]);

    const handleSort = (field: "date" | "category" | "amount") => {
        setSortConfig((prev) => ({
            field,
            direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
        }))
    }
    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
                return;
            }
            const res = await BulkDeleteTransactions([id]);
            if (res.success) {
                toast.success("Transaction deleted successfully");
                setSelectedIds([]);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.log(error);
            toast.error("Error deleting transaction. Please try again.");
        } finally {
            setLoading(false);
            setSelectedIds([]);
        }
    }
    const handleBulkDelete = async () => {
        try {
            setLoading(true);
            if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions? This action cannot be undone.`)) {
                return;
            }
            const res = await BulkDeleteTransactions(selectedIds);
            if (res.success) {
                toast.success(res.message);
                setSelectedIds([]);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.log(error);
            toast.error("Error deleting transactions. Please try again.");
        } finally {
            setLoading(false);
            setSelectedIds([]);
        }
    }
    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
    const handleSelectAll = () => {
        setSelectedIds(prev => prev.length === paginatedTransactions.length ? [] : paginatedTransactions.map(i => i.id));
    }
    const handleClearFilters = () => {
        setSearchTerm("");
        setTypeFilter("");
        setRecurringFilter("");
        setSelectedIds([]);
        setCurrentPage(1);
    }

    return (
        <div className="space-y-4 container mx-auto w-full max-w-[1450px]">
            {/* <BarLoader className="mt-4" width={"100%"} color="#9333ea" loading={loading} /> */}
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-8"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={typeFilter}
                        onValueChange={(value) => {
                            setTypeFilter(value);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={recurringFilter}
                        onValueChange={(value) => {
                            setRecurringFilter(value);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[155px]">
                            <SelectValue placeholder="All Transactions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recurring">Recurring Only</SelectItem>
                            <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                        </SelectContent>
                    </Select>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="font-medium" disabled={loading}>
                                <TrashIcon className="size-4" />
                                Delete Selected ({selectedIds.length})
                            </Button>
                        </div>
                    )}
                    {(searchTerm || typeFilter || recurringFilter) && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClearFilters}
                            title="Clear Filters"
                        >
                            <XIcon className="size-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Transactions table */}
            <div className="border border-gray-200 rounded-sm">
                {loading ? (
                    <Skeleton className="h-80 w-full conatiner mx-auto max-w-[1450px]" />
                ) : (
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                                    <div className="flex items-center">Date {sortConfig.field === "date" && (
                                        sortConfig.direction === "asc" ? <ChevronUpIcon className="size-4 ml-1" /> : <ChevronDownIcon className="size-4 ml-1" />
                                    )}</div>
                                </TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                                    <div className="flex items-center">Category {sortConfig.field === "category" && (
                                        sortConfig.direction === "asc" ? <ChevronUpIcon className="size-4 ml-1" /> : <ChevronDownIcon className="size-4 ml-1" />
                                    )}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                                    <div className="flex items-center">Amount {sortConfig.field === "amount" && (
                                        sortConfig.direction === "asc" ? <ChevronUpIcon className="size-4 ml-1" /> : <ChevronDownIcon className="size-4 ml-1" />
                                    )}</div>
                                </TableHead>
                                <TableHead>Recurring</TableHead>
                                <TableHead className="w-[50px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                                        No Transactions Found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTransactions.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="w-[50px]">
                                            <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => handleSelect(item.id)} />
                                        </TableCell>
                                        <TableCell>{format(item.date, "PP")}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="capitalize">
                                            <span
                                                style={{
                                                    background: categoryColors[item.category],
                                                }}
                                                className="px-2 py-1 rounded text-white text-sm"
                                            >
                                                {item.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "font-medium",
                                            item.type === "EXPENSE" ? "text-red-500" : "text-green-500"
                                        )}>
                                            {item.type === "EXPENSE" ? "-" : "+"}
                                            ₹{parseFloat(item.amount.toString()).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="">
                                            {item.isRecurring ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Badge variant="outline" className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                                                                <RefreshCwIcon className="size-3" />
                                                                {RECURRING_INTERVALS[item.recurringInterval!]}
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="text-xs">
                                                                <div className="font-medium">Next Date:</div>
                                                                <div>{format(item.nextRecurringDate!, "PP")}</div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <Badge variant="outline" className="gap-1">
                                                    <ClockIcon className="size-3" />
                                                    One-time
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-left w-[50px]">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="size-8 p-0">
                                                        <MoreHorizontalIcon className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => router.push(`/transaction/create?edit=${item.id}`)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-5">
                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeftIcon className="size-4" />
                            <span className="hidden sm:block">Prev</span>
                        </Button>
                        <span className="text-sm text-muted-foreground font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <span className="hidden sm:block">Next</span>
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
