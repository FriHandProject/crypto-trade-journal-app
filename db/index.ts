import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as tradesSchema from './schema/trades';

export const db = drizzle(process.env.DATABASE_URL!, {
    schema: { ...authSchema, ...tradesSchema }
});

// Export all schema types
export * from './schema/auth';
export * from './schema/trades';