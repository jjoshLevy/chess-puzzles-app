import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using the modern import.meta.url method
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build the absolute path to the database file
const dbFilePath = path.join(__dirname, 'db.sqlite');

// This forces the app to use the local db.sqlite file
export const db = new Database(dbFilePath);