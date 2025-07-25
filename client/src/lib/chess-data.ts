// Sample chess puzzles data
export const samplePuzzles = [
  {
    id: 1,
    title: "Puzzle #47,832",
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    objective: "White to play and mate in 2 moves",
    solution: ["Nxe5", "Qh5+"],
    difficulty: "advanced",
    category: "tactics",
    theme: "fork",
    rating: 1847,
    moves: ["1. e4 e5", "2. Nf3 Nc6", "3. Bc4 Nf6"],
  },
  {
    id: 2,
    title: "Puzzle #47,831",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    objective: "Find the best move for White",
    solution: ["d4"],
    difficulty: "intermediate",
    category: "tactics",
    theme: "pin",
    rating: 1654,
    moves: ["1. e4 e5", "2. Nf3 Nc6"],
  },
  {
    id: 3,
    title: "Puzzle #47,830",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
    objective: "White to play and win material",
    solution: ["exd5"],
    difficulty: "beginner",
    category: "tactics",
    theme: "capture",
    rating: 1200,
    moves: ["1. e4 d5"],
  }
];

export const puzzleCategories = [
  { name: "Tactics", count: 847000, description: "Pin, fork, skewer, and more" },
  { name: "Endgames", count: 423000, description: "King and pawn endings" },
  { name: "Openings", count: 312000, description: "Opening principles and traps" },
  { name: "Checkmates", count: 189000, description: "Forced mate patterns" },
  { name: "Sacrifices", count: 95000, description: "Material sacrifices for advantage" },
];

export const puzzleThemes = [
  "Pin", "Fork", "Skewer", "Discovered Attack", "Double Attack", 
  "Deflection", "Decoy", "Clearance", "Interference", "X-Ray",
  "Zugzwang", "Stalemate", "Promotion", "En Passant", "Castling"
];

export const difficultyLevels = [
  { value: "beginner", label: "★☆☆ Beginner", description: "Rating 800-1200" },
  { value: "intermediate", label: "★★☆ Intermediate", description: "Rating 1200-1800" },
  { value: "advanced", label: "★★★ Advanced", description: "Rating 1800+" },
];
