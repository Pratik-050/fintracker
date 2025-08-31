"use client";

import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

const chartConfig = {
  income: {
    label: "Income",
    color: "#22c55e",
  },
  expense: {
    label: "Expense",
    color: "#ef4444",
  },
  balance: {
    label: "Balance",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const chartColors = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Calculate date ranges - use useMemo to prevent infinite re-renders
  const { from, to } = useMemo(() => {
    const today = new Date();
    const getDateRange = () => {
      switch (dateRange) {
        case "7d":
          return { from: subDays(today, 7), to: today };
        case "30d":
          return { from: subDays(today, 30), to: today };
        case "90d":
          return { from: subDays(today, 90), to: today };
        case "1y":
          return { from: subDays(today, 365), to: today };
        case "custom":
          return { from: dateFrom ?? subDays(today, 30), to: dateTo ?? today };
        default:
          return { from: subDays(today, 30), to: today };
      }
    };
    return getDateRange();
  }, [dateRange, dateFrom, dateTo]);

  // Get expense summary for category breakdown
  const { data: expenseSummary, isLoading: expenseLoading } =
    api.transaction.getSummary.useQuery({
      from,
      to,
      type: "expense",
    });

  // Get income summary
  const { data: incomeSummary, isLoading: incomeLoading } =
    api.transaction.getSummary.useQuery({
      from,
      to,
      type: "income",
    });

  // Format data for charts
  const categoryData =
    expenseSummary?.map((item, index) => ({
      category: item.category ?? "Other",
      amount: Number(item.total),
      color: chartColors[index % chartColors.length],
    })) ?? [];

  // Calculate totals for summary
  const totalIncome =
    incomeSummary?.reduce((sum, item) => sum + Number(item.total ?? 0), 0) ?? 0;
  const totalExpenses =
    expenseSummary?.reduce((sum, item) => sum + Number(item.total ?? 0), 0) ??
    0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Visualize your financial data with charts and insights
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Select date range and filters for your analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Preset Date Ranges */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date From */}
              {dateRange === "custom" && (
                <>
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
                        {dateFrom
                          ? format(dateFrom, "MMM dd, yyyy")
                          : "From date"}
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
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6">
          {/* Income vs Expenses Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-4" />
                Income vs Expenses Summary
              </CardTitle>
              <CardDescription>
                Financial overview for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomeLoading || expenseLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent"></div>
                  <span className="text-muted-foreground ml-3">
                    Loading data...
                  </span>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600">
                      Income Sources
                    </h3>
                    {incomeSummary && incomeSummary.length > 0 ? (
                      incomeSummary.map((item) => (
                        <div
                          key={item.category}
                          className="flex items-center justify-between rounded-lg bg-green-50 p-3"
                        >
                          <span className="font-bold dark:text-black">
                            {item.category ?? "Other"}
                          </span>
                          <span className="font-bold text-green-600">
                            ${Number(item.total).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">
                        No income recorded
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-600">
                      Expense Categories
                    </h3>
                    {expenseSummary && expenseSummary.length > 0 ? (
                      expenseSummary.map((item) => (
                        <div
                          key={item.category}
                          className="flex items-center justify-between rounded-lg bg-red-50 p-3"
                        >
                          <span className="font-bold dark:text-black">
                            {item.category ?? "Other"}
                          </span>
                          <span className="font-bold text-red-600">
                            ${Number(item.total).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">
                        No expenses recorded
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="size-4" />
                  Expenses by Category
                </CardTitle>
                <CardDescription>
                  Breakdown of your spending by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenseLoading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent"></div>
                    <span className="text-muted-foreground ml-3">
                      Loading chart...
                    </span>
                  </div>
                ) : categoryData.length === 0 ? (
                  <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                    <div className="text-center">
                      <PieChart className="mx-auto mb-2 size-12" />
                      <p>No expense data available for this period</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex h-[400px] items-center justify-center">
                      <ChartContainer
                        config={chartConfig}
                        className="h-[400px] w-[400px]"
                      >
                        <RechartsPieChart
                          width={400}
                          height={400}
                          data={categoryData}
                        >
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload?.[0]?.payload) {
                                const data = payload[0].payload as {
                                  category: string;
                                  amount: number;
                                };
                                return (
                                  <div className="bg-background rounded-lg border p-2 shadow-sm">
                                    <div className="grid gap-1">
                                      <span className="text-sm font-medium">
                                        {data.category}
                                      </span>
                                      <span className="text-muted-foreground text-sm">
                                        ${data.amount.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="amount"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ChartContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {categoryData.map((item) => (
                        <div
                          key={item.category}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="size-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.category}</span>
                          <span className="ml-auto font-medium">
                            ${item.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>
                  Key metrics for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="flex h-[400px] flex-col justify-center">
                {incomeLoading || expenseLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent"></div>
                    <span className="text-muted-foreground ml-3">
                      Loading summary...
                    </span>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-center space-y-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="size-5 text-green-600" />
                          <span className="text-base font-medium">
                            Total Income
                          </span>
                        </div>
                        <span className="text-xl font-bold text-green-600">
                          ${totalIncome.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                        <div className="flex items-center gap-3">
                          <TrendingDown className="size-5 text-red-600" />
                          <span className="text-base font-medium">
                            Total Expenses
                          </span>
                        </div>
                        <span className="text-xl font-bold text-red-600">
                          ${totalExpenses.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                        <span className="text-base font-semibold">
                          Net Income
                        </span>
                        <span
                          className={`text-2xl font-bold ${
                            totalIncome - totalExpenses >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {totalIncome - totalExpenses >= 0 ? "+" : ""}$
                          {(totalIncome - totalExpenses).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-t pt-6">
                      <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800/50">
                        <div className="text-3xl font-bold text-blue-600">
                          {(incomeSummary?.length ?? 0) +
                            (expenseSummary?.length ?? 0)}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm font-medium">
                          Categories
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800/50">
                        <div className="text-3xl font-bold text-blue-600">
                          $
                          {totalExpenses > 0
                            ? Math.round(
                                totalExpenses / (expenseSummary?.length ?? 1),
                              )
                            : 0}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm font-medium">
                          Avg. per Category
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
