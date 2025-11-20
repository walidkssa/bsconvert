"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SubscriptionRequiredModal from "@/components/modals/subscription-required-modal";
import { InsufficientCreditsModal } from "@/components/modals/insufficient-credits-modal";
import { CreditsDisplay } from "@/components/credits-display";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsInfo, setCreditsInfo] = useState<{ needed: number; available: number }>({ needed: 0, available: 0 });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

    if (droppedFile && validTypes.includes(droppedFile.type)) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Type de fichier invalide. Veuillez uploader un PDF, JPG ou PNG.");
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

    if (selectedFile && validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Type de fichier invalide. Veuillez uploader un PDF, JPG ou PNG.");
    }
  }, []);

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(20);

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        const errorData = await response.json();

        // Handle subscription required error
        if (errorData.error === "SUBSCRIPTION_REQUIRED" || response.status === 402) {
          setShowSubscriptionModal(true);
          setProgress(0);
          setIsProcessing(false);
          return;
        }

        // Handle insufficient credits error
        if (errorData.error === "INSUFFICIENT_CREDITS") {
          setCreditsInfo({
            needed: errorData.required || 0,
            available: errorData.available || 0,
          });
          setShowCreditsModal(true);
          setProgress(0);
          setIsProcessing(false);
          return;
        }

        throw new Error(errorData.error || "Erreur lors du traitement");
      }

      const data = await response.json();
      setProgress(100);
      setResult(data);

      // Trigger credits badge update
      window.dispatchEvent(new CustomEvent('credits-updated'));

      // Rediriger vers la page de résultats avec l'ID de conversion
      if (data.conversionId) {
        setTimeout(() => {
          router.push(`/results/${data.conversionId}`);
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUploader = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Nouvelle conversion</h1>
        <p className="text-lg text-muted-foreground">
          Convertissez vos relevés bancaires en fichiers comptables en quelques secondes
        </p>
      </div>

      {/* Credits Display - Compact */}
      <CreditsDisplay variant="compact" showUpgradeButton={false} />

      {/* Upload Card */}
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle>Upload de document</CardTitle>
          <CardDescription>
            Formats acceptés : PDF, JPG, PNG • Taille max : 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-smooth ${
              isDragging
                ? "border-foreground bg-accent"
                : "border-border hover:border-foreground/50 hover:bg-accent/50"
            }`}
          >
            {!file ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full border-2 border-border p-6">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou cliquez pour parcourir
                  </p>
                </div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" className="pointer-events-none">
                    Parcourir les fichiers
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/jpeg,image/jpg,image/png"
                    onChange={handleFileInput}
                  />
                </label>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-mono text-sm font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isProcessing && (
                    <Button variant="ghost" size="sm" onClick={resetUploader}>
                      Retirer
                    </Button>
                  )}
                </div>

                {isProcessing && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-medium">
                        {progress < 30
                          ? "Upload en cours..."
                          : progress < 70
                          ? "Analyse par IA..."
                          : "Extraction des transactions..."}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground font-mono">
                      {progress}% complété
                    </p>
                  </div>
                )}

                {!isProcessing && !result && (
                  <Button onClick={processFile} className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    Analyser avec l'IA
                  </Button>
                )}

                {result && (
                  <Alert className="border-foreground/20 bg-accent">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Conversion réussie!</AlertTitle>
                    <AlertDescription>
                      {result.transactions?.length || 0} transactions détectées
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conversion en moins de 30 secondes grâce à l'IA Grok 4
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Précis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              100% de précision avec détection automatique des anomalies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conforme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Exports FEC, Sage, Cegid conformes aux normes françaises
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      <InsufficientCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        creditsNeeded={creditsInfo.needed}
        creditsAvailable={creditsInfo.available}
        fileName={file?.name}
      />
    </div>
  );
}
