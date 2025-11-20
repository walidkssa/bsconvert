'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FreeTrial() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ downloadUrl: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Reset previous state
      setError(null);
      setResult(null);

      // Validate file type (PDF only for free trial)
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are supported for the free trial');
        return;
      }

      // Validate file size (10MB max for free trial)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setError('File too large. Maximum size is 10MB for free trial');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outputFormat', 'xlsx'); // Default to Excel for free trial

      const response = await fetch('/api/free-trial-convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'TRIAL_LIMIT_REACHED') {
          setError('You have already used your free trial. Please sign up to continue converting files!');
        } else if (data.error === 'FILE_TOO_LARGE') {
          setError(data.message || 'File is too large for free trial');
        } else {
          setError(data.message || 'Conversion failed. Please try again.');
        }
        return;
      }

      // Success - create download link
      setResult({
        downloadUrl: data.downloadUrl,
        fileName: data.fileName,
      });
    } catch (err) {
      console.error('Conversion error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="py-12 xs:py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-100 dark:hover:bg-green-950">
            No Credit Card Required
          </Badge>
          <h2 className="text-3xl xs:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Try It Free
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Convert your first bank statement completely free. No signup, no credit card required.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            One-time trial per visitor
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 md:p-12">
          {!result ? (
            <>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/30 bg-muted/50 hover:border-primary/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="free-trial-upload"
                />

                {!file ? (
                  <label htmlFor="free-trial-upload" className="cursor-pointer">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF files only (Max 10MB)
                    </p>
                  </label>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-1">{file.name}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={resetForm}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Choose a different file
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex gap-3">
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              {/* Convert Button */}
              <div className="mt-8">
                <Button
                  onClick={handleConvert}
                  disabled={!file || isConverting}
                  size="lg"
                  className="w-full text-lg h-14"
                >
                  {isConverting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Converting...
                    </>
                  ) : (
                    <>
                      Convert to Excel
                      <svg
                        className="ml-2 w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </Button>
              </div>

              {/* Features */}
              <div className="mt-8 pt-8 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-foreground">No Signup</p>
                      <p className="text-xs text-muted-foreground">Try instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Secure</p>
                      <p className="text-xs text-muted-foreground">Data encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Fast</p>
                      <p className="text-xs text-muted-foreground">Results in seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Success State
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Conversion Complete!</h3>
              <p className="text-muted-foreground mb-8">Your file has been successfully converted.</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  asChild
                >
                  <a href={result.downloadUrl} download={result.fileName}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download File
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetForm}
                >
                  Convert Another
                </Button>
              </div>

              <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Need to convert more files?
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign up for unlimited conversions with powerful features and priority support.
                </p>
                <Button
                  variant="outline"
                  asChild
                >
                  <a href="/auth/signup">Create Free Account</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
