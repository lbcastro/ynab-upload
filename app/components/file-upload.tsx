'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, CheckCircle2, XCircle, Upload, X, Clock, Moon, Sun, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

interface Log {
  message: string;
  timestamp: string;
  success: boolean;
  isRetry?: boolean;
}

interface FileUploadProps {
  onUpload?: (files: File[]) => void;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    setIsRateLimited(false);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.status === 429) {
          setIsRateLimited(true);
          setLogs(prev => [
            ...prev,
            {
              message: data.error,
              timestamp: new Date().toISOString(),
              success: false,
              isRetry: true
            }
          ]);
          
          const checkStatus = setInterval(async () => {
            const statusResponse = await fetch('/api/status');
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'completed') {
              clearInterval(checkStatus);
              setIsRateLimited(false);
              setLogs(prev => [
                ...prev,
                {
                  message: 'Upload completed successfully after retries',
                  timestamp: new Date().toISOString(),
                  success: true
                }
              ]);
            }
          }, 5000);

        } else if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        if (data.details) {
          const lines = data.details.split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) {
              setLogs(prev => [
                ...prev,
                {
                  message: line,
                  timestamp: new Date().toISOString(),
                  success: !line.includes('error') && !line.includes('failed') && !line.includes('Skip'),
                  isRetry: line.includes('⏳')
                }
              ]);
            }
          });
        }
      }

      setFiles([]);
      
    } catch (error) {
      console.error('Upload error:', error);
      setLogs(prev => [
        ...prev,
        {
          message: error instanceof Error ? error.message : 'Upload failed',
          timestamp: new Date().toISOString(),
          success: false
        }
      ]);
    } finally {
      if (!isRateLimited) {
        setUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-base font-medium">YNAB Import</h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://app.ynab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Open YNAB <ExternalLink className="ml-2 h-4 w-4" />
            </a>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-md"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4 mt-[10vh]">
        <div className={cn(
          "grid gap-6 items-start transition-all duration-300",
          logs.length > 0 ? "lg:grid-cols-2" : "max-w-2xl mx-auto"
        )}>
          <Card className="border shadow-sm">
            <CardContent className="space-y-6 p-6">
              <div
                {...getRootProps()}
                className={cn(
                  'relative border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out',
                  'aspect-[2/1] flex flex-col items-center justify-center gap-4 p-8',
                  isDragActive ? 'border-primary bg-primary/5 border-primary/50' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                )}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-base text-muted-foreground font-medium">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground/75 mt-1">
                    Supports CSV files only
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border/50"
                    >
                      <span className="text-sm truncate px-2">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full text-base hover:bg-primary hover:text-primary-foreground"
                size="lg"
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isRateLimited ? 'Retrying...' : 'Uploading...'}
                  </>
                ) : (
                  'Upload Files'
                )}
              </Button>
            </CardContent>
          </Card>

          <AnimatePresence>
            {logs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border shadow-sm sticky top-20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium">Upload Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2">
                      {logs.map((log, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'flex items-center gap-3 p-2.5 rounded-md border transition-colors duration-150',
                            log.success ? 'bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400' : 
                            log.isRetry ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                            'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400'
                          )}
                        >
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          ) : log.isRetry ? (
                            <Clock className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="flex-1 text-sm font-medium">{log.message}</span>
                        </motion.div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
} 