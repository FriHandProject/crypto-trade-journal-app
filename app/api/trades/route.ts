import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { trades } from "@/db/schema/trades";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Zod schema for trade validation
const createTradeSchema = z.object({
  tradingPair: z.string().min(1, "Trading pair is required"),
  entryPrice: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid entry price format"),
  exitPrice: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid exit price format"),
  profitOrLoss: z.string().regex(/^-?\d+(\.\d{1,8})?$/, "Invalid profit/loss format"),
  screenshotUrl: z.string().url().optional().or(z.literal("")),
  tradeDate: z.string().datetime("Invalid trade date format"),
});

// GET /api/trades - Fetch all trades for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get the session to authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters for pagination and sorting
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Fetch trades for the authenticated user
    const userTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, session.user.id))
      .orderBy(desc(trades.tradeDate))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: trades.id })
      .from(trades)
      .where(eq(trades.userId, session.user.id));

    const totalCount = totalCountResult.length;

    return NextResponse.json({
      trades: userTrades,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/trades - Create a new trade
export async function POST(request: NextRequest) {
  try {
    // Get the session to authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();

    try {
      const validatedData = createTradeSchema.parse(body);

      // Convert string values to decimal for database
      const tradeData = {
        userId: session.user.id,
        tradingPair: validatedData.tradingPair.toUpperCase(),
        entryPrice: validatedData.entryPrice,
        exitPrice: validatedData.exitPrice,
        profitOrLoss: validatedData.profitOrLoss,
        screenshotUrl: validatedData.screenshotUrl || null,
        tradeDate: new Date(validatedData.tradeDate),
      };

      // Insert the new trade
      const [newTrade] = await db.insert(trades).values(tradeData).returning();

      return NextResponse.json({
        message: "Trade created successfully",
        trade: newTrade,
      }, { status: 201 });

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}