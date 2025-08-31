import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const transactionRouter = createTRPCRouter({
  getTransactions: protectedProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause = {
        userId: ctx.session.user.id,
        date: {
          gte: input.from,
          lte: input.to,
        },
      };

      const transaction = await ctx.db.transaction.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const totalCount = await ctx.db.transaction.count({ where: whereClause });

      return {
        transactions: transaction,
        totalCount: totalCount,
      };
    }),

  createTransaction: protectedProcedure
    .input(
      z.object({
        type: z.enum(["income", "expense"]),
        category: z.string().optional(),
        amount: z.number().positive(),
        description: z.string().optional(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),
  updateTransaction: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        type: z.enum(["income", "expense"]).optional(),
        category: z.string().optional(),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...dataToUpdate } = input;
      return await ctx.db.transaction.update({
        where: {
          id: id,
          userId: ctx.session.user.id, // Ensures user can only update their own transactions
        },
        data: {
          ...dataToUpdate,
        },
      });
    }),
  deleteTransaction: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction.deleteMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Ensures user can only delete their own transactions
        },
      });
    }),
  getSummary: protectedProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
        type: z.enum(["income", "expense"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const summary = await ctx.db.transaction.groupBy({
        by: ["category"],
        where: {
          userId: ctx.session.user.id,
          type: input.type,
          date: {
            gte: input.from,
            lte: input.to,
          },
        },
        _sum: {
          amount: true,
        },
      });

      // The result needs to be mapped to match the previous structure
      return summary.map((item) => ({
        category: item.category,
        total: item._sum.amount,
      }));
    }),
  getMonthlySummary: protectedProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.transaction.groupBy({
        by: ["type"],
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: input.from,
            lte: input.to,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const monthly = await ctx.db.$queryRaw<
        Array<{ month: number; year: number; type: string; total: number }>
      >`
      SELECT 
        EXTRACT(MONTH FROM "date")::int AS month,
        EXTRACT(YEAR FROM "date")::int AS year,
        type,
        SUM(amount)::int AS total
      FROM "Transaction"
      WHERE "userId" = ${ctx.session.user.id}
        AND "date" BETWEEN ${input.from} AND ${input.to}
      GROUP BY year, month, type
      ORDER BY year, month;
    `;

      // Transform to { month: 'Jan', income: ..., expense: ... }
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const data: Record<
        string,
        { month: string; income: number; expense: number }
      > = {};

      monthly.forEach((row) => {
        const key = `${row.year}-${row.month}`;
        data[key] ??= {
          month: `${monthNames[row.month - 1]} ${row.year}`,
          income: 0,
          expense: 0,
        };
        data[key][row.type as "income" | "expense"] = row.total;
      });

      return Object.values(data);
    }),
});
