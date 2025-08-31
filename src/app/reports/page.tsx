"use client";

import { useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly");
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));

  const monthlyQuery = api.transaction.getMonthlySummary.useQuery(
    {
    from: new Date(dateFrom), // ensure Date object
    to: new Date(dateTo),
  },
  );

  const categoryQuery = api.transaction.getSummary.useQuery(
    { from: new Date(dateFrom), to: new Date(dateTo), type: "expense" },
  );

  const handleExportReport = (format: "csv" | "pdf") => {
    // Simulate report export
    console.log(`Exporting ${reportType} report as ${format.toUpperCase()}`);
    // In a real app, this would trigger a download
    alert(`Report exported as ${format.toUpperCase()}!`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate and download detailed financial reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExportReport("csv")}>
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
            <Button onClick={() => handleExportReport("pdf")}>
              <Download className="mr-2 size-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Configure the parameters for your financial report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                  <SelectItem value="category">Category Breakdown</SelectItem>
                  <SelectItem value="detailed">
                    Detailed Transactions
                  </SelectItem>
                  <SelectItem value="trend">Trend Analysis</SelectItem>
                </SelectContent>
              </Select>

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
          </CardContent>
        </Card>

        {/* Report Content */}
        {reportType === "monthly" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" />
                Monthly Summary Report
              </CardTitle>
              <CardDescription>
                Overview of your financial activity by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyQuery.isLoading ? (
                <p>Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Total Income</TableHead>
                      <TableHead className="text-right">Total Expenses</TableHead>
                      <TableHead className="text-right">Net Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyQuery.data?.map((row, index) => {
                      const netIncome = row.income - row.expense;
                      return (
                        <TableRow key={index}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell className="text-right text-green-600">
                            ${row.income}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ${row.expense}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              netIncome > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {netIncome > 0 ? "+" : ""}${netIncome}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {reportType === "category" && (
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Spending breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryQuery.isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {categoryQuery.data?.map((category, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {category.category}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {Math.round(Number(category.total ?? 0))}$
                          </span>
                        </div>
                        <div className="bg-muted h-2 w-full rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full max-w-6xl"
                            style={{
                              width: `${Number(category.total ?? 0)/100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(reportType === "detailed" || reportType === "trend") && (
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "detailed"
                  ? "Detailed Transaction Report"
                  : "Trend Analysis Report"}
              </CardTitle>
              <CardDescription>
                {reportType === "detailed"
                  ? "Complete list of all transactions in the selected period"
                  : "Financial trends and patterns over time"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground py-8 text-center">
                <FileText className="mx-auto mb-4 size-12" />
                <p className="mb-2 text-lg font-medium">Report Preview</p>
                <p>
                  {reportType === "detailed"
                    ? "This report will include all transaction details for the selected period."
                    : "This report will show spending trends, patterns, and forecasts."}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => handleExportReport("pdf")}
                >
                  Generate Full Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
