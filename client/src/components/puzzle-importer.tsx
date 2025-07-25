import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Download, Database, Upload } from "lucide-react";

export function PuzzleImporter() {
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [maxPuzzles, setMaxPuzzles] = useState("1000");
  const [maxRating, setMaxRating] = useState("2000");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: { url: string; maxPuzzles: number; maxRating: number }) => {
      const response = await fetch("/api/import/url", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Import failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful!",
        description: `Imported ${data.imported} puzzles successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/puzzles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setUrl("");
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import puzzles",
        variant: "destructive",
      });
    }
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (data: { file: File; maxPuzzles: number; maxRating: number }) => {
      const formData = new FormData();
      formData.append('puzzleFile', data.file);
      formData.append('maxPuzzles', data.maxPuzzles.toString());
      formData.append('maxRating', data.maxRating.toString());

      const response = await fetch("/api/import/file", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "File upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File Import Successful!",
        description: `Imported ${data.imported} puzzles from your file`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/puzzles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "File Import Failed",
        description: error instanceof Error ? error.message : "Failed to import puzzles from file",
        variant: "destructive",
      });
    }
  });

  const handleImport = () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to the puzzle file",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({
      url: url.trim(),
      maxPuzzles: parseInt(maxPuzzles) || 1000,
      maxRating: parseInt(maxRating) || 2000
    });
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      toast({
        title: "File Required",
        description: "Please select a puzzle file to upload",
        variant: "destructive",
      });
      return;
    }

    fileUploadMutation.mutate({
      file: selectedFile,
      maxPuzzles: parseInt(maxPuzzles) || 1000,
      maxRating: parseInt(maxRating) || 2000
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Import Large Puzzle Files (Up to 500MB)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Direct Upload</TabsTrigger>
            <TabsTrigger value="url">URL Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileUpload">Select Puzzle File</Label>
              <Input
                id="fileUpload"
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={fileUploadMutation.isPending}
              />
              {selectedFile && (
                <p className="text-sm text-green-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              <p className="text-sm text-gray-600">
                Select CSV/Excel files (up to 500MB). For Excel files, please convert to CSV first for best results.
              </p>
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800">Convert Excel to CSV:</p>
                <p className="text-blue-700">Open your Excel file → File → Save As → Choose "CSV (Comma delimited)" format</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPuzzlesUpload">Max Puzzles</Label>
                <Input
                  id="maxPuzzlesUpload"
                  type="number"
                  placeholder="1000"
                  value={maxPuzzles}
                  onChange={(e) => setMaxPuzzles(e.target.value)}
                  disabled={fileUploadMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRatingUpload">Max Rating</Label>
                <Input
                  id="maxRatingUpload"
                  type="number"
                  placeholder="2000"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  disabled={fileUploadMutation.isPending}
                />
              </div>
            </div>

            <Button 
              onClick={handleFileUpload} 
              disabled={fileUploadMutation.isPending || !selectedFile}
              className="w-full"
            >
              {fileUploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading File...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload and Import
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Puzzle File URL</Label>
              <Input
                id="url"
                placeholder="https://drive.google.com/uc?id=YOUR_FILE_ID&export=download"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={importMutation.isPending}
              />
              <p className="text-sm text-gray-600">
                Enter a direct download URL (Google Drive, Dropbox, etc.) - No file uploads needed!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPuzzles">Max Puzzles</Label>
                <Input
                  id="maxPuzzles"
                  type="number"
                  placeholder="1000"
                  value={maxPuzzles}
                  onChange={(e) => setMaxPuzzles(e.target.value)}
                  disabled={importMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRating">Max Rating</Label>
                <Input
                  id="maxRating"
                  type="number"
                  placeholder="2000"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  disabled={importMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Setup (No File Uploads!)</Label>
              <Textarea
                readOnly
                value={`BYPASS 100MB LIMIT - Use URL Import:

1. Download Lichess puzzles from lichess.org/training
2. Upload to Google Drive, Dropbox, or similar service  
3. Get DIRECT download link (not preview link)
4. Paste URL above and click Import

Google Drive tip:
- Share file → Anyone with link → Copy link
- Change: drive.google.com/file/d/FILE_ID/view
- To: drive.google.com/uc?id=FILE_ID&export=download

System automatically detects themes and organizes by difficulty!`}
                className="text-sm resize-none font-mono"
                rows={12}
              />
            </div>

            <Button 
              onClick={handleImport} 
              disabled={importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing Puzzles...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Puzzles
                </>
              )}
            </Button>

            {importMutation.isPending && (
              <div className="text-sm text-gray-600 text-center">
                Processing large file... This may take several minutes
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}