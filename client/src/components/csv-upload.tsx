import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVUploadProps {
  onUpload: (content: string, fileName: string) => void;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  testId?: string;
}

export function CSVUpload({
  onUpload,
  isLoading = false,
  error = null,
  success = false,
  testId,
}: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(content, file.name);
      };
      reader.readAsText(file);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors cursor-pointer",
        isDragging && "border-primary bg-primary/5",
        error && "border-destructive",
        success && "border-emerald-500"
      )}
      data-testid={testId}
    >
      <CardContent className="p-8">
        <div
          className="flex flex-col items-center justify-center gap-4 text-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleInputChange}
            data-testid="input-csv-file"
          />

          <div
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-full",
              isLoading
                ? "bg-primary/10"
                : error
                ? "bg-destructive/10"
                : success
                ? "bg-emerald-500/10"
                : "bg-muted"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : error ? (
              <AlertCircle className="w-8 h-8 text-destructive" />
            ) : success ? (
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            ) : fileName ? (
              <FileText className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            {isLoading ? (
              <p className="text-sm font-medium">Analyzing {fileName}...</p>
            ) : error ? (
              <>
                <p className="text-sm font-medium text-destructive">Upload Failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </>
            ) : success ? (
              <>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Analysis Complete
                </p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {fileName ? fileName : "Drop CSV file here or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expected format: cycle, voltage, current
                </p>
              </>
            )}
          </div>

          {!isLoading && !success && (
            <Button variant="outline" size="sm" data-testid="button-upload-csv">
              <Upload className="w-4 h-4 mr-2" />
              Select File
            </Button>
          )}

          {success && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                handleClick();
              }}
              data-testid="button-upload-another"
            >
              Upload Another
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
