import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./schema/relations";

export const db = drizzle(process.env.DATABASE_URL!, { relations });
