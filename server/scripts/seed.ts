import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { db } from '../db';
import { puzzles } from '../db/schema';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDatabase = async () => {
  console.log('🌱 [ULTIMATE DIAGNOSTIC] Starting seed process...');

  const results: any[] = [];
  const csvFilePath = path.resolve(__dirname, '..', '..', 'Book(Sheet1).csv');

  console.log(`📖 Reading CSV file from: ${csvFilePath}`);

  fs.createReadStream(csvFilePath)
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`✅ CSV file successfully processed. Found ${results.length} rows.`);
      
      if (results.length === 0) {
          console.log('No data to insert. Exiting.');
          return;
      }

      try {
        console.log('🗑️  Attempting to delete all existing puzzles...');
        await db.delete(puzzles);
        console.log('✅ Existing puzzles deleted successfully.');
      } catch (error) {
        console.error('❌ FAILED TO DELETE PUZZLES. THIS IS THE ERROR:', error);
        return; // Stop if we can't delete
      }

      const safeParseInt = (value: string) => {
          const parsed = parseInt(value, 10);
          return isNaN(parsed) ? 0 : parsed;
      };
      
      const formattedPuzzles = results.map(row => ({
          puzzleId: row.puzzle || 'N/A',
          fen: row.FEN || '',
          moves: row.move || '',
          rating: safeParseInt(row.rating),
          ratingDeviation: safeParseInt(row.ratingDEV),
          popularity: safeParseInt(row.popularity),
          nbPlays: safeParseInt(row['NB plays']),
          themes: row.themes || '',
          gameUrl: row.url || '',
          openingTags: row.OpeningTags || ''
      }));

      console.log('📦 Attempting to insert 100 puzzles. First puzzle object:', formattedPuzzles[0]);

      try {
        await db.insert(puzzles).values(formattedPuzzles);
        console.log('🎉🎉🎉 SUCCESS! Data was inserted into the database! 🎉🎉🎉');
      } catch (error) {
        console.error('❌❌❌ THE INSERTION FAILED. THIS IS THE REAL DATABASE ERROR: ❌❌❌');
        console.error(error);
      }
      
      console.log('Script has finished.');
    });
};

seedDatabase();