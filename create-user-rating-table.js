// create-user-rating-table.js
const Database = require('better-sqlite3');
const db = new Database('./path/to/your/database.sqlite'); // update path if needed

db.prepare(`
  CREATE TABLE IF NOT EXISTS UserRating (
    userId TEXT PRIMARY KEY,
    rating INTEGER DEFAULT 1500
  );
`).run();

console.log('UserRating table created!');