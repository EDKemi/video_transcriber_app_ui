'use client';

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { Upload, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState('');

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Add the user_id parameter - you'll need to get this from your auth system
      // For now using a placeholder - replace with actual user ID from your auth
      const userId = 'user123'; // Replace with actual user ID
      
      // Get the API URL from environment variable
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Call the Python FastAPI backend
      const response = await fetch(`${apiUrl}/upload-video/?user_id=${userId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error processing video');
      }
      
      // Update progress as we go
      setProgress(50);
      
      // Get the response data with transcription
      const data = await response.json();
      
      // Set the transcription from the API response
      setTranscription(data.transcription);
      
      // Set progress to 100% and stop "Transcribing..." status
      setProgress(100);
      setUploading(false);
      
    } catch (error) {
      console.error('Error uploading or transcribing video:', error);
      alert(`Error uploading or transcribing video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <label 
            htmlFor="video-upload" 
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">MP4, WebM, or MOV (MAX. 500MB)</p>
            </div>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {file && (
            <p className="text-sm text-gray-500">
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload & Transcribe"
            )}
          </Button>

          {(uploading || progress > 0) && (
            <div className="w-full mt-4">
              <Progress value={progress} className="h-2" />
              {uploading && (
                <p className="mt-2 text-sm text-center text-gray-500">
                  {progress < 50 ? "Uploading..." : "Transcribing..."}
                </p>
              )}
            </div>
          )}

          {transcription && (
            <div className="w-full mt-4 p-4 border rounded-lg">
              <h3 className="mb-2 font-medium">Transcription:</h3>
              <p className="text-sm text-gray-700">{transcription}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}