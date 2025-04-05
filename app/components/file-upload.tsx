'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, CheckCircle2, XCircle, Upload, X, Clock, Moon, Sun, ExternalLink, PartyPopper, Sparkles, Rocket, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const myConfettiRef = useRef<any>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Initialize confetti on component mount
  useEffect(() => {
    if (confettiCanvasRef.current) {
      confettiCanvasRef.current.style.position = 'fixed';
      confettiCanvasRef.current.style.top = '0';
      confettiCanvasRef.current.style.left = '0';
      confettiCanvasRef.current.style.width = '100vw';
      confettiCanvasRef.current.style.height = '100vh';
      confettiCanvasRef.current.style.zIndex = '9999';
      confettiCanvasRef.current.style.pointerEvents = 'none';
      
      // Create a confetti instance bound to our canvas
      myConfettiRef.current = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true
      });
    }
    
    // Cleanup function
    return () => {
      if (myConfettiRef.current) {
        myConfettiRef.current.reset();
      }
    };
  }, []);

  // Function to trigger confetti celebration
  const triggerCelebration = useCallback(() => {
    if (!myConfettiRef.current) return;
    
    // Make sure the canvas is visible
    if (confettiCanvasRef.current) {
      confettiCanvasRef.current.style.display = 'block';
    }
    
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#FF1493', '#00FFFF', '#FFD700', '#7FFF00', '#FF4500', '#9400D3'];
    
    // Create confetti burst
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    
    // Reset any previous confetti
    myConfettiRef.current.reset();
    
    // Initial massive burst from bottom center
    myConfettiRef.current({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.9, x: 0.5 },
      colors: colors,
      startVelocity: 55,
      gravity: 0.8,
      shapes: ['circle', 'square'],
      scalar: 1.5,
      ticks: 200
    });
    
    // Continuous confetti - more frequent and intense
    const interval = setInterval(() => {
      if (Date.now() > animationEnd) {
        clearInterval(interval);
        
        // Set a timeout to hide the canvas after the animation is complete
        setTimeout(() => {
          if (confettiCanvasRef.current) {
            confettiCanvasRef.current.style.display = 'none';
          }
        }, 2000);
        
        return;
      }
      
      // Random bursts from different positions across the entire screen
      const randomX = randomInRange(0.1, 0.9);
      const randomY = randomInRange(0.1, 0.9);
      
      myConfettiRef.current({
        particleCount: 80,
        angle: randomInRange(0, 360),
        spread: randomInRange(50, 120),
        origin: { x: randomX, y: randomY },
        colors: colors.sort(() => 0.5 - Math.random()),
        disableForReducedMotion: true,
        drift: randomInRange(-2, 2),
        ticks: 300
      });
    }, 150);
    
    // Multiple cannons from all sides of the screen
    // Bottom edge
    myConfettiRef.current({
      particleCount: 120,
      angle: 270,
      spread: 90,
      origin: { x: 0.1, y: 1 },
      startVelocity: 55,
      gravity: 0.8,
      colors: colors
    });
    
    myConfettiRef.current({
      particleCount: 120,
      angle: 270,
      spread: 90,
      origin: { x: 0.9, y: 1 },
      startVelocity: 55,
      gravity: 0.8,
      colors: colors
    });
    
    // Left edge
    myConfettiRef.current({
      particleCount: 120,
      angle: 0,
      spread: 90,
      origin: { x: 0, y: 0.5 },
      startVelocity: 55,
      gravity: 0.8,
      colors: colors
    });
    
    // Right edge
    myConfettiRef.current({
      particleCount: 120,
      angle: 180,
      spread: 90,
      origin: { x: 1, y: 0.5 },
      startVelocity: 55,
      gravity: 0.8,
      colors: colors
    });
    
    // Top edge
    myConfettiRef.current({
      particleCount: 120,
      angle: 90,
      spread: 90,
      origin: { x: 0.5, y: 0 },
      startVelocity: 55,
      gravity: 0.8,
      colors: colors
    });
    
    // Add firework-like explosions at different screen positions
    setTimeout(() => {
      myConfettiRef.current({
        particleCount: 150,
        spread: 360,
        origin: { x: 0.3, y: 0.5 },
        startVelocity: 35,
        gravity: 0.6,
        colors: colors,
        shapes: ['circle'],
        scalar: 1.5
      });
    }, 800);
    
    setTimeout(() => {
      myConfettiRef.current({
        particleCount: 150,
        spread: 360,
        origin: { x: 0.7, y: 0.5 },
        startVelocity: 35,
        gravity: 0.6,
        colors: colors,
        shapes: ['circle'],
        scalar: 1.5
      });
    }, 1200);
    
    // Bottom corners
    setTimeout(() => {
      myConfettiRef.current({
        particleCount: 120,
        spread: 120,
        origin: { x: 0.1, y: 0.9 },
        startVelocity: 45,
        gravity: 0.5,
        colors: colors
      });
      
      myConfettiRef.current({
        particleCount: 120,
        spread: 120,
        origin: { x: 0.9, y: 0.9 },
        startVelocity: 45,
        gravity: 0.5,
        colors: colors
      });
    }, 1800);
    
    // Final burst before ending
    setTimeout(() => {
      myConfettiRef.current({
        particleCount: 250,
        spread: 180,
        origin: { x: 0.5, y: 0.5 },
        gravity: 0.5,
        colors: colors,
        ticks: 200
      });
    }, 3000);
    
    return () => {
      clearInterval(interval);
      if (myConfettiRef.current) {
        myConfettiRef.current.reset();
      }
      if (confettiCanvasRef.current) {
        confettiCanvasRef.current.style.display = 'none';
      }
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setShowSuccess(false);
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
    setShowSuccess(false);
    
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
              
              // Show success and trigger celebration
              setShowSuccess(true);
              triggerCelebration();
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
      
      // Show success and trigger celebration if not rate limited
      if (!isRateLimited) {
        setShowSuccess(true);
        triggerCelebration();
      }
      
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

  // Function to simulate a successful upload for testing
  const simulateSuccessfulUpload = () => {
    // Add some sample logs to simulate processing
    setLogs([
      {
        message: 'Starting import of test_file.csv',
        timestamp: new Date().toISOString(),
        success: true
      },
      {
        message: 'Processing 120 transactions',
        timestamp: new Date().toISOString(),
        success: true
      },
      {
        message: 'Successfully imported 118 transactions',
        timestamp: new Date().toISOString(),
        success: true
      },
      {
        message: 'Skipped 2 duplicate transactions',
        timestamp: new Date().toISOString(),
        success: false,
        isRetry: true
      },
      {
        message: 'Import completed successfully',
        timestamp: new Date().toISOString(),
        success: true
      }
    ]);
    
    // Trigger success state and confetti
    setShowSuccess(true);
    triggerCelebration();
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
              {showSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center relative overflow-hidden"
                >
                  {/* Background animated stars */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        initial={{ 
                          x: `${Math.random() * 100}%`, 
                          y: `${Math.random() * 100}%`, 
                          opacity: 0,
                          scale: 0
                        }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0],
                          rotate: [0, 180]
                        }}
                        transition={{ 
                          duration: 2,
                          delay: i * 0.1,
                          repeat: 1,
                          repeatType: "reverse"
                        }}
                      >
                        <Star className={`h-${Math.floor(Math.random() * 3) + 3} w-${Math.floor(Math.random() * 3) + 3} text-${['yellow', 'green', 'blue', 'purple', 'pink'][Math.floor(Math.random() * 5)]}-400`} />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Main celebration icon with enhanced animation */}
                  <motion.div
                    className="relative z-10"
                    initial={{ rotate: 0, scale: 0.5 }}
                    animate={{ 
                      rotate: [0, 15, -15, 15, -15, 0],
                      scale: [0.5, 1.2, 1, 1.1, 1],
                      y: [0, -20, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                      ease: "easeInOut"
                    }}
                  >
                    <div className="relative">
                      <PartyPopper className="h-20 w-20 mx-auto text-green-500 dark:text-green-400" />
                      
                      {/* Animated zaps around the party popper */}
                      <motion.div
                        className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/4"
                        animate={{ 
                          rotate: [0, 45, -45, 0],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{ duration: 1.5, repeat: 1, repeatType: "reverse" }}
                      >
                        <Zap className="h-8 w-8 text-yellow-400" />
                      </motion.div>
                      
                      <motion.div
                        className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/4"
                        animate={{ 
                          rotate: [0, -45, 45, 0],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{ duration: 1.5, repeat: 1, repeatType: "reverse", delay: 0.3 }}
                      >
                        <Zap className="h-8 w-8 text-yellow-400" />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  {/* Success text with enhanced animation */}
                  <motion.h3 
                    className="text-3xl font-bold text-green-700 dark:text-green-300 mt-4 relative z-10"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ 
                      y: 0, 
                      opacity: 1,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      delay: 0.3,
                      duration: 0.8
                    }}
                  >
                    <span className="inline-block">
                      <motion.span
                        className="inline-block"
                        animate={{ 
                          rotate: [0, 10, -10, 10, -10, 0],
                          color: ['#10b981', '#3b82f6', '#8b5cf6', '#10b981']
                        }}
                        transition={{ duration: 2, repeat: 1 }}
                      >
                        Success!
                      </motion.span>
                    </span> 
                    <motion.span
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 1],
                        rotate: [0, 30, 0]
                      }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="inline-block ml-2"
                    >
                      🎉
                    </motion.span>
                  </motion.h3>
                  
                  <motion.p 
                    className="mt-2 text-xl text-green-600 dark:text-green-400 relative z-10"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    All your files have been processed successfully!
                  </motion.p>
                  
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="relative z-10"
                  >
                    <Button 
                      onClick={() => setShowSuccess(false)} 
                      className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 text-lg font-medium"
                    >
                      <motion.span
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          repeatType: "mirror"
                        }}
                        className="flex items-center gap-2"
                      >
                        <Rocket className="h-5 w-5" />
                        Upload More Files
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <>
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
                </>
              )}
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
      
      {/* Canvas for confetti (positioned absolutely to cover the whole screen) */}
      <canvas 
        ref={confettiCanvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
} 