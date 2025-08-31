"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  date: z.date(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const categories = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
  expense: [
    "Food",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Bills",
    "Healthcare",
    "Education",
    "Travel",
    "Other",
  ],
};

interface TransactionDialogProps {
  children?: React.ReactNode;
  onSubmit?: (data: TransactionFormValues) => void;
  mode?: "add" | "edit";
  initialData?: {
    id: number;
    type: "income" | "expense";
    category?: string | null;
    amount: number;
    description?: string | null;
    date: Date;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTransactionDialog({
  children,
  onSubmit,
  mode = "add",
  initialData,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const utils = api.useUtils();

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialData?.type ?? "expense",
      category: initialData?.category ?? "",
      amount: initialData?.amount ?? 0,
      description: initialData?.description ?? "",
      date: initialData?.date ?? new Date(),
    },
  });

  const selectedType = form.watch("type");

  // Reset form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData && mode === "edit") {
      form.reset({
        type: initialData.type,
        category: initialData.category ?? "",
        amount: initialData.amount,
        description: initialData.description ?? "",
        date: initialData.date,
      });
    }
  }, [initialData, mode, form]);

  const createTransactionMutation =
    api.transaction.createTransaction.useMutation({
      onSuccess: async () => {
        // Invalidate and refetch transaction queries more aggressively
        await utils.transaction.getTransactions.invalidate();
        await utils.transaction.getSummary.invalidate();

        // Also force refetch to ensure UI updates immediately
        await utils.transaction.invalidate();

        void utils.invalidate();

        toast.success("Transaction added successfully!", {
          description: `${form.getValues().type} of $${form.getValues().amount} has been recorded.`,
        });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast.error("Failed to add transaction", {
          description: error.message,
        });
      },
    });

  const updateTransactionMutation =
    api.transaction.updateTransaction.useMutation({
      onSuccess: async () => {
        // Invalidate and refetch transaction queries more aggressively
        await utils.transaction.getTransactions.invalidate();
        await utils.transaction.getSummary.invalidate();

        // Also force refetch to ensure UI updates immediately
        await utils.transaction.invalidate();

        void utils.invalidate();

        toast.success("Transaction updated successfully!", {
          description: `${form.getValues().type} of $${form.getValues().amount} has been updated.`,
        });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast.error("Failed to update transaction", {
          description: error.message,
        });
      },
    });

  const handleSubmit = (data: TransactionFormValues) => {
    if (mode === "edit" && initialData?.id) {
      updateTransactionMutation.mutate({
        id: initialData.id,
        type: data.type,
        category: data.category || undefined,
        amount: data.amount,
        description: data.description ?? undefined,
        date: data.date,
      });
    } else {
      createTransactionMutation.mutate({
        type: data.type,
        category: data.category || undefined,
        amount: data.amount,
        description: data.description ?? undefined,
        date: data.date,
      });
    }
    onSubmit?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only render DialogTrigger in add mode or when children are provided */}
      {(mode === "add" || children) && (
        <DialogTrigger asChild>
          {children ?? (
            <Button>
              <Plus className="mr-2 size-4" />
              Add Transaction
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the details of your transaction."
              : "Add a new income or expense transaction to your finance tracker."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories[selectedType].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="text-muted-foreground absolute top-1 left-3">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description for this transaction..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional details about this transaction.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={
                  createTransactionMutation.isPending ||
                  updateTransactionMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createTransactionMutation.isPending ||
                  updateTransactionMutation.isPending
                }
              >
                {mode === "edit"
                  ? updateTransactionMutation.isPending
                    ? "Updating..."
                    : "Update Transaction"
                  : createTransactionMutation.isPending
                    ? "Adding..."
                    : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
