import { db } from '../db';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';

console.log('🚀 Starting Final, Paranoid Seed Script...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.resolve(__dirname, '../data/puzzles.csv');
console.log(`📖 Reading original CSV file from: ${csvFilePath}`);

const csvFile = fs.readFileSync(csvFilePath, 'utf8');

Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        const allPuzzles = results.data as any[];
        console.log(`✅ Raw CSV file successfully processed. Found ${allPuzzles.length} total rows.`);

        // --- THIS IS THE FINAL FIX ---
        // Explicitly filter out any row that is actually the header row.
        const noHeaderPuzzles = allPuzzles.filter(p => p.PuzzleId !== 'PuzzleId');
        console.log(`👍 Filtered out the fake header row. Now have ${noHeaderPuzzles.length} puzzles.`);
        // -----------------------------

        // Now, deduplicate the remaining puzzles
        const seenIds = new Set<string>();
        const uniquePuzzles = noHeaderPuzzles.filter(p => {
            if (!p.PuzzleId) return false;
            const isDuplicate = seenIds.has(p.PuzzleId);
            if (!isDuplicate) seenIds.add(p.PuzzleId);
            return !isDuplicate;
        });
        console.log(`👍 Deduplication complete. Found ${uniquePuzzles.length} unique puzzles.`);

        // Final validation step from before
        const REQUIRED_HEADERS = ['PuzzleId', 'FEN', 'Moves', 'Rating', 'Themes'];
        const validPuzzles = uniquePuzzles.filter(puzzle => {
            for (const header of REQUIRED_HEADERS) {
                if (puzzle[header] === undefined || puzzle[header] === null) return false;
            }
            return true;
        });
        console.log(`🗑️  Validation complete. Found and skipped ${uniquePuzzles.length - validPuzzles.length} corrupted row(s).`);
        
        // Now, insert the final, clean data
        try {
            db.exec('DELETE FROM Puzzle');
            console.log(`🚀 Inserting ${validPuzzles.length} fully validated puzzles...`);

            const insert = db.prepare(
                'INSERT INTO Puzzle (PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays, Themes, GameUrl, OpeningTags) VALUES (@PuzzleId, @FEN, @Moves, @Rating, @RatingDeviation, @Popularity, @NbPlays, @Themes, @GameUrl, @OpeningTags)'
            );
            const insertMany = db.transaction((puzzles) => {
                for (const puzzle of puzzles) insert.run(puzzle);
            });

            insertMany(validPuzzles);
            console.log('🏆🏆🏆 SUCCESS! The database is now clean and correctly populated!');

        } catch (err: any) {
            console.error(`❌ DATABASE ERROR DURING FINAL INSERT: ${err.message}`);
            process.exit(1);
        }
    }
});