"use client";

import { useSession } from "next-auth/react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { subDays, startOfMonth, endOfMonth } from "date-fns";
import { useMemo } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";

export default function Home() {
  const { data: session } = useSession();

  // Date ranges for queries - use useMemo to prevent infinite re-renders
  const { today, monthStart, monthEnd, thirtyDaysAgo } = useMemo((): {
    today: Date;
    monthStart: Date;
    monthEnd: Date;
    thirtyDaysAgo: Date;
  } => {
    const now = new Date();
    return {
      today: now,
      monthStart: startOfMonth(now),
      monthEnd: endOfMonth(now),
      thirtyDaysAgo: subDays(now, 30),
    };
  }, []);

  // Get recent transactions
  const { data: recentTransactionsData, isLoading: recentTransactionsLoading } =
    api.transaction.getTransactions.useQuery(
      {
        from: thirtyDaysAgo,
        to: today,
        limit: 10,
        offset: 0,
      },
      {
        enabled: !!session?.user,
      },
    );

  // Get monthly income summary
  const { data: monthlyIncome } = api.transaction.getSummary.useQuery(
    {
      from: monthStart,
      to: monthEnd,
      type: "income",
    },
    {
      enabled: !!session?.user,
    },
  );

  // Get monthly expense summary
  const { data: monthlyExpenses } = api.transaction.getSummary.useQuery(
    {
      from: monthStart,
      to: monthEnd,
      type: "expense",
    },
    {
      enabled: !!session?.user,
    },
  );

  // Calculate stats from real data
  const totalMonthlyIncome =
    monthlyIncome?.reduce((sum, item) => sum + Number(item.total ?? 0), 0) ?? 0;
  const totalMonthlyExpenses =
    monthlyExpenses?.reduce((sum, item) => sum + Number(item.total ?? 0), 0) ??
    0;
  const totalBalance = totalMonthlyIncome - totalMonthlyExpenses;
  const transactionCount = recentTransactionsData?.totalCount ?? 0;

  // Prepare chart data for overview chart
  const overviewChartData = [
    {
      month: monthStart.toLocaleDateString("en-US", { month: "short" }),
      income: totalMonthlyIncome,
      expense: totalMonthlyExpenses,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}! Here&apos;s your financial
              overview.
            </p>
          </div>
          <AddTransactionDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Balance"
            value={`$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Income minus expenses this month"
            icon={DollarSign}
            trend={
              totalBalance > 0
                ? { value: Math.abs(totalBalance / 100), isPositive: true }
                : undefined
            }
          />
          <StatsCard
            title="Monthly Income"
            value={`$${totalMonthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Income this month"
            icon={TrendingUp}
          />
          <StatsCard
            title="Monthly Expenses"
            value={`$${totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            description="Expenses this month"
            icon={TrendingDown}
          />
          <StatsCard
            title="Transactions"
            value={transactionCount.toString()}
            description="Total transactions"
            icon={CreditCard}
          />
        </div>

        {/* Charts and Recent Transactions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <OverviewChart
              data={overviewChartData}
              isLoading={!monthlyIncome || !monthlyExpenses}
            />
          </div>
          <div className="col-span-3">
            <RecentTransactions
              transactions={
                recentTransactionsData?.transactions.map((t) => ({
                  ...t,
                  amount: Number(t.amount),
                  type: t.type as "income" | "expense",
                })) ?? []
              }
              isLoading={recentTransactionsLoading}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your finances
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <AddTransactionDialog>
              <Button variant="outline">Add Income</Button>
            </AddTransactionDialog>
            <AddTransactionDialog>
              <Button variant="outline">Add Expense</Button>
            </AddTransactionDialog>
            <Button variant="outline" asChild>
              <a href="/receipt-upload">Upload Receipt</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/reports">View Reports</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
