// Apply db/schema.sql to DATABASE_URL (idempotent). The API also does this on startup.
import 'dotenv/config';
import { migrate, closeDatabase } from '../src/config/database.js';

await migrate();
await closeDatabase();
console.log('Schema applied');
