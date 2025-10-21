import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { trades } from "@/db/schema/trades";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Zod schema for trade update validation
const updateTradeSchema = z.object({
  tradingPair: z.string().min(1, "Trading pair is required").optional(),
  entryPrice: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid entry price format").optional(),
  exitPrice: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid exit price format").optional(),
  profitOrLoss: z.string().regex(/^-?\d+(\.\d{1,8})?$/, "Invalid profit/loss format").optional(),
  screenshotUrl: z.string().url().optional().or(z.literal("")).optional(),
  tradeDate: z.string().datetime("Invalid trade date format").optional(),
});

// PUT /api/trades/[id] - Update a specific trade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tradeId = params.id;

    // Parse and validate the request body
    const body = await request.json();

    try {
      const validatedData = updateTradeSchema.parse(body);

      // Build update data object
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validatedData.tradingPair !== undefined) {
        updateData.tradingPair = validatedData.tradingPair.toUpperCase();
      }
      if (validatedData.entryPrice !== undefined) {
        updateData.entryPrice = validatedData.entryPrice;
      }
      if (validatedData.exitPrice !== undefined) {
        updateData.exitPrice = validatedData.exitPrice;
      }
      if (validatedData.profitOrLoss !== undefined) {
        updateData.profitOrLoss = validatedData.profitOrLoss;
      }
      if (validatedData.screenshotUrl !== undefined) {
        updateData.screenshotUrl = validatedData.screenshotUrl || null;
      }
      if (validatedData.tradeDate !== undefined) {
        updateData.tradeDate = new Date(validatedData.tradeDate);
      }

      // Update the trade (only if it belongs to the authenticated user)
      const [updatedTrade] = await db
        .update(trades)
        .set(updateData)
        .where(and(
          eq(trades.id, tradeId),
          eq(trades.userId, session.user.id)
        ))
        .returning();

      if (!updatedTrade) {
        return NextResponse.json(
          { error: "Trade not found or you don't have permission to update it" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "Trade updated successfully",
        trade: updatedTrade,
      });

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
    console.error("Error updating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/trades/[id] - Delete a specific trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tradeId = params.id;

    // Delete the trade (only if it belongs to the authenticated user)
    const deleteResult = await db
      .delete(trades)
      .where(and(
        eq(trades.id, tradeId),
        eq(trades.userId, session.user.id)
      ))
      .returning({ id: trades.id });

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { error: "Trade not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Trade deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}