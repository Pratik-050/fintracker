"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";

// Type that matches the backend response
interface Transaction {
  id: number;
  type: string; // Backend returns string, we cast it
  category: string | null;
  amount: number; // We'll convert Decimal to number
  description: string | null;
  date: Date;
  userId: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({
  transactions = [],
  isLoading,
}: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="bg-muted size-9 animate-pulse rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="bg-muted h-4 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                </div>
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View all
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No transactions yet. Start by adding your first transaction!
            </div>
          ) : (
            transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center space-x-4">
                <div
                  className={`flex size-9 items-center justify-center rounded-full ${
                    transaction.type === "income"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="size-4" />
                  ) : (
                    <ArrowDownRight className="size-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {transaction.description ??
                      `${transaction.type} transaction`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {transaction.category && (
                      <Badge variant="secondary" className="mr-2">
                        {transaction.category}
                      </Badge>
                    )}
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div
                  className={`text-sm font-medium ${
                    transaction.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
