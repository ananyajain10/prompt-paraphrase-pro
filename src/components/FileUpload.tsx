
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      setError('Please upload only TXT, PDF, or DOCX files');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const getIcon = () => {
    if (isDragActive) return <Upload className="w-12 h-12 text-primary animate-bounce" />;
    return <FileText className="w-12 h-12 text-muted-foreground" />;
  };

  const getText = () => {
    if (isDragReject) return "File type not supported";
    if (isDragActive) return "Drop your transcript here...";
    return "Drop your transcript here, or click to browse";
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5 scale-105",
          isDragAccept && "border-green-500 bg-green-500/5",
          isDragReject && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          {getIcon()}
          <div>
            <p className="text-lg font-medium">
              {getText()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports TXT, PDF, DOCX files up to 10MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <File className="w-4 h-4" />
          <span>TXT</span>
        </div>
        <div className="flex items-center space-x-1">
          <File className="w-4 h-4" />
          <span>PDF</span>
        </div>
        <div className="flex items-center space-x-1">
          <File className="w-4 h-4" />
          <span>DOCX</span>
        </div>
      </div>
    </div>
  );
};
