import pgPkg from 'pg';
const { Pool } = pgPkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_6wbaohczs9DW@ep-plain-art-a2kehd1c.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });