CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"trading_pair" text NOT NULL,
	"entry_price" decimal(20, 8) NOT NULL,
	"exit_price" decimal(20, 8) NOT NULL,
	"profit_or_loss" decimal(20, 8) NOT NULL,
	"screenshot_url" text,
	"trade_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "trades_user_id_idx" ON "trades" ("user_id");
--> statement-breakpoint
CREATE INDEX "trades_trade_date_idx" ON "trades" ("trade_date");
--> statement-breakpoint
CREATE INDEX "trades_user_trade_date_idx" ON "trades" ("user_id", "trade_date");
--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;