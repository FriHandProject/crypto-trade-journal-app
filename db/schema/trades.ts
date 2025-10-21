import {
    pgTable,
    text,
    decimal,
    timestamp,
    uuid,
    index
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const trades = pgTable("trades", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    tradingPair: text("trading_pair").notNull(),
    entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
    exitPrice: decimal("exit_price", { precision: 20, scale: 8 }).notNull(),
    profitOrLoss: decimal("profit_or_loss", { precision: 20, scale: 8 }).notNull(),
    screenshotUrl: text("screenshot_url"),
    tradeDate: timestamp("trade_date").notNull(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("trades_user_id_idx").on(table.userId),
    tradeDateIdx: index("trades_trade_date_idx").on(table.tradeDate),
    userTradeDateIdx: index("trades_user_trade_date_idx").on(table.userId, table.tradeDate),
}));

// TypeScript types for the trades table
export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;