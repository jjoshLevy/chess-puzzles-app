import { AppHeader } from "@/components/app-header";
import { PuzzleImporter } from "@/components/puzzle-importer";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Import Large Puzzle Files
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Import thousands of chess puzzles from Lichess or other sources. 
            The system will automatically organize them by tactical themes and difficulty.
          </p>
        </div>

        <div className="flex justify-center">
          <PuzzleImporter />
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">How to Import Lichess Puzzles</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <div>
                <p className="font-medium">Download the Lichess puzzle database</p>
                <p className="text-sm text-gray-600">Visit lichess.org/training and download the puzzle CSV file</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <div>
                <p className="font-medium">Upload to a file sharing service</p>
                <p className="text-sm text-gray-600">Since files exceed 100MB, upload to Google Drive, Dropbox, or similar service</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <div>
                <p className="font-medium">Get the direct download link</p>
                <p className="text-sm text-gray-600">Make sure the link directly downloads the file (not a preview page)</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
              <div>
                <p className="font-medium">Paste URL and import</p>
                <p className="text-sm text-gray-600">Use the form above to import puzzles with automatic theme detection</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">✅ No More 100MB Upload Limit!</h3>
          <div className="bg-white rounded p-4 border border-green-300">
            <p className="text-sm text-green-800 mb-2 font-medium">This completely bypasses file upload restrictions by using direct URLs:</p>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>• Upload your large file to Google Drive, Dropbox, etc.</li>
              <li>• Get the direct download link (not preview)</li>
              <li>• Paste URL in the form above</li>
              <li>• System downloads and processes automatically</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">What happens during import:</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Automatic detection of tactical themes (pins, forks, checkmates, etc.)</li>
            <li>• Rating-based difficulty scaling (1200=beginner, 1800=intermediate, 2000+=advanced)</li>
            <li>• Intelligent categorization by puzzle patterns</li>
            <li>• Duplicate detection and filtering</li>
            <li>• Batch processing to handle large files efficiently</li>
          </ul>
        </div>
      </div>
    </div>
  );
}