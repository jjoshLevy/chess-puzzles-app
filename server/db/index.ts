import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// This loads your .env.local file to get the database URL
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

// This creates the 'db' object that your application will use to talk to the database
export const db = drizzle(sql, { schema });