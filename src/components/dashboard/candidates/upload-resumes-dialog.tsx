import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { FileText, X, Upload, Loader2 } from 'lucide-react';
import { createCandidate } from '@/lib/firebase/candidates';
import { extractResumeData } from '@/lib/openai';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';

interface UploadResumesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
}

export function UploadResumesDialog({ open, onOpenChange, onUploadComplete }: UploadResumesDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const type = file.type.toLowerCase();
      return type === 'application/pdf' || 
             type === 'application/msword' || 
             type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             type.startsWith('image/');
    });

    const newFiles = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending' as const
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFileProgress = (index: number, progress: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], progress };
      return newFiles;
    });
  };

  const updateFileStatus = (index: number, status: FileWithPreview['status'], error?: string) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], status, error };
      return newFiles;
    });
  };

  const handleUpload = async () => {
    setIsUploading(true);
    let successCount = 0;
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const { file } = selectedFiles[i];
        updateFileStatus(i, 'processing');
        
        try {
          // Extract data using OpenAI Vision
          updateFileProgress(i, 50);
          const parsedData = await extractResumeData(file);
          
          // Create candidate record with parsed data
          updateFileProgress(i, 80);
          await createCandidate({
            name: parsedData.name || file.name.split('.')[0],
            email: parsedData.email || '',
            resumeUrl: '',
            score: null,
            status: 'pre-interview',
            skills: parsedData.skills || [],
            experience: parsedData.experience || 0,
            education: parsedData.education || '',
            recruiterId: auth.currentUser?.uid || '',
          }, file);

          updateFileProgress(i, 100);
          updateFileStatus(i, 'complete');
          successCount++;
        } catch (error) {
          console.error('Error processing resume:', error);
          updateFileStatus(i, 'error', 'Failed to process resume');
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} resume${successCount === 1 ? '' : 's'}`);
        
        // Call onUploadComplete callback
        onUploadComplete?.();
        
        // Close dialog after a short delay to show completion
        setTimeout(() => {
          onOpenChange(false);
          setSelectedFiles([]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error uploading resumes:', error);
      toast.error('Failed to upload resumes');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Resumes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-full">
              <label 
                htmlFor="resume-upload" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, or Images (Max 10MB per file)
                  </p>
                </div>
                <Input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {file.file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(file.file.size / 1024)} KB)
                          </span>
                        </div>
                        {!isUploading && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {(isUploading || file.status !== 'pending') && (
                        <div className="space-y-1">
                          <Progress value={file.progress} className="h-1" />
                          <p className="text-xs text-muted-foreground">
                            {file.status === 'processing' && 'Processing...'}
                            {file.status === 'complete' && 'Complete'}
                            {file.status === 'error' && file.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}