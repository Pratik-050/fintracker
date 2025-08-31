"use client";

import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { Calendar as CalendarIcon, Filter, Search } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  // Create stable default dates using useMemo to prevent infinite re-renders
  const defaultDates = useMemo(
    () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
    [],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(defaultDates.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(defaultDates.to);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{
    id: number;
    type: "income" | "expense";
    category?: string | null;
    amount: number;
    description?: string | null;
    date: Date;
  } | null>(null);

  // Get transactions with current filters
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
  } = api.transaction.getTransactions.useQuery(
    {
      from: dateFrom ?? defaultDates.from,
      to: dateTo ?? defaultDates.to,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    },
    {
      // Enable background refetching to catch new data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      // Refetch when user comes back to tab
      refetchOnReconnect: true,
    },
  );

  const transactions = transactionData?.transactions ?? [];
  const totalCount = transactionData?.totalCount ?? 0;

  // Filter transactions client-side for search and type/category filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      !searchTerm ||
      (transaction.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ??
        false) ||
      (transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false);

    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    const matchesCategory =
      categoryFilter === "all" || transaction.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Get unique categories from transactions
  const categories = Array.from(
    new Set(transactions.map((t) => t.category).filter(Boolean)),
  );

  // Add delete mutation
  const utils = api.useUtils();
  const deleteTransactionMutation =
    api.transaction.deleteTransaction.useMutation({
      onSuccess: async () => {
        // Invalidate and refetch to ensure UI updates
        await utils.transaction.getTransactions.invalidate();
        await utils.transaction.getSummary.invalidate();
        toast.success("Transaction deleted successfully!");
      },
      onError: (error) => {
        toast.error("Failed to delete transaction", {
          description: error.message,
        });
      },
    });

  const handleDeleteTransaction = (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      void deleteTransactionMutation.mutate({ id });
    }
  };

  const handleEditTransaction = (transaction: {
    id: number;
    type: "income" | "expense";
    category?: string | null;
    amount: number;
    description?: string | null;
    date: Date;
  }) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Manage and view all your financial transactions
            </p>
          </div>
          <AddTransactionDialog
            onSubmit={() => {
              // Force refetch when a transaction is added via this dialog
              void refetch();
            }}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="size-4" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter transactions by type, category, date, or search term
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) =>
                    category ? (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ) : null,
                  )}
                </SelectContent>
              </Select>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                  setDateFrom(defaultDates.from);
                  setDateTo(defaultDates.to);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transactions{" "}
              {isLoading
                ? "(Loading...)"
                : `(${filteredTransactions.length}${filteredTransactions.length !== totalCount ? ` of ${totalCount}` : ""})`}
            </CardTitle>
            <CardDescription>
              All your financial transactions in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent"></div>
                <span className="text-muted-foreground ml-3">
                  Loading transactions...
                </span>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="mb-2 text-red-600">Error loading transactions</p>
                <p className="text-muted-foreground text-sm">{error.message}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground py-8 text-center"
                      >
                        {transactions.length === 0
                          ? "No transactions found. Start by adding your first transaction!"
                          : "No transactions match your filters. Try adjusting them."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === "income"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              transaction.type === "income"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.category && (
                            <Badge variant="outline">
                              {transaction.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{transaction.description ?? "—"}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {Number(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEditTransaction({
                                  id: transaction.id,
                                  type: transaction.type as
                                    | "income"
                                    | "expense",
                                  category: transaction.category,
                                  amount: Number(transaction.amount),
                                  description: transaction.description,
                                  date: new Date(transaction.date),
                                })
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                              disabled={deleteTransactionMutation.isPending}
                            >
                              {deleteTransactionMutation.isPending
                                ? "..."
                                : "Delete"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Transaction Dialog */}
        {editingTransaction && (
          <AddTransactionDialog
            mode="edit"
            initialData={editingTransaction}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditingTransaction(null);
              }
            }}
            onSubmit={() => {
              // Force refetch when a transaction is edited
              void refetch();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
