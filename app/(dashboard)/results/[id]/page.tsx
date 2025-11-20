"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, CheckCircle2, AlertTriangle, FileText, FileSpreadsheet, Building2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExportFormatSelector from "@/components/export-format-selector";
import AccountingConfigForm from "@/components/accounting-config-form";
import ValidationSummary from "@/components/validation-summary";
import { useConversion } from "@/lib/hooks/useConversions";
import type { ExportFormat, AccountingConfig } from "@/lib/accounting-formats";
import type { Database } from "@/lib/database.types";

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const conversionId = params.id as string;

  const { conversion, loading, error } = useConversion(conversionId);

  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat | null>(null);
  const [downloadedFormats, setDownloadedFormats] = React.useState<Set<ExportFormat>>(new Set());
  const [showAccountingConfig, setShowAccountingConfig] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFormatSelection = (format: ExportFormat) => {
    setSelectedFormat(format);

    if (format === "fec" || format === "sage" || format === "cegid" || format === "quickbooks" || format === "xero") {
      setShowAccountingConfig(true);
    } else {
      downloadStandardFormat(format);
    }
  };

  const downloadStandardFormat = (format: ExportFormat) => {
    if (format === "csv") {
      downloadCSV();
    } else if (format === "excel") {
      downloadExcel();
    }
    setDownloadedFormats(prev => new Set(prev).add(format));
  };

  const handleAccountingConfig = async (config: AccountingConfig) => {
    if (!conversion || !selectedFormat) return;

    setIsProcessing(true);

    try {
      const response = await fetch("/api/generate-accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: conversion.transactions,
          format: selectedFormat,
          config,
          currency: conversion.currency || "EUR",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate accounting file");
      }

      const data = await response.json();
      downloadAccountingFile(data.content, data.filename, data.mimeType);

      if (selectedFormat) {
        setDownloadedFormats(prev => new Set(prev).add(selectedFormat));
      }
      setShowAccountingConfig(false);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAccountingFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!conversion?.csv_data) return;
    const blob = new Blob([conversion.csv_data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    if (!conversion?.excel_data) return;
    const byteCharacters = atob(conversion.excel_data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold">Chargement...</h2>
          <p className="text-muted-foreground">
            Récupération des résultats de conversion
          </p>
        </div>
      </div>
    );
  }

  if (error || !conversion) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Erreur</h2>
          <p className="text-muted-foreground">
            {error || "Impossible de charger les résultats de conversion"}
          </p>
          <Button asChild>
            <Link href="/convert">Nouvelle conversion</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (conversion.status !== "completed") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold">Conversion en cours...</h2>
          <p className="text-muted-foreground">
            Statut: {conversion.status}
          </p>
          <Button asChild>
            <Link href="/history">Voir l'historique</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/convert">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-4xl font-bold tracking-tight">Résultats</h1>
          </div>
          <p className="text-muted-foreground">
            Conversion terminée avec succès
          </p>
        </div>
      </div>

      {/* Success Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-accent p-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold">Extraction réussie!</h3>
              <p className="text-sm text-muted-foreground">
                {conversion.transaction_count || 0} transactions détectées depuis{" "}
                <span className="font-medium">{conversion.bank_name || "votre banque"}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline">
                  {conversion.account_type || "checking"}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {conversion.currency || "EUR"}
                </Badge>
                {conversion.period_start && conversion.period_end && (
                  <Badge variant="outline">
                    {new Date(conversion.period_start).toLocaleDateString()} - {new Date(conversion.period_end).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Exporter vos données</h2>
          <p className="text-muted-foreground mt-1">
            Choisissez le format adapté à vos besoins
          </p>
        </div>

        {!showAccountingConfig ? (
          <ExportFormatSelector
            onSelect={handleFormatSelection}
            downloadedFormats={downloadedFormats}
          />
        ) : (
          <AccountingConfigForm
            onSubmit={handleAccountingConfig}
            onCancel={() => setShowAccountingConfig(false)}
          />
        )}
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu des transactions</CardTitle>
          <CardDescription>
            Les 10 premières transactions extraites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversion.transactions?.slice(0, 10).map((transaction: Transaction, index: number) => (
              <div
                key={transaction.id || index}
                className="flex items-center justify-between border-b border-border py-3 last:border-0"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {transaction.debit && (
                    <span className="font-mono text-sm text-muted-foreground">
                      -{transaction.debit}
                    </span>
                  )}
                  {transaction.credit && (
                    <span className="font-mono text-sm font-medium">
                      +{transaction.credit}
                    </span>
                  )}
                  <span className="font-mono text-sm font-medium min-w-[100px] text-right">
                    {transaction.balance}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {conversion.transactions && conversion.transactions.length > 10 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              ... et {conversion.transactions.length - 10} autres transactions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/convert">
            <FileText className="mr-2 h-4 w-4" />
            Nouvelle conversion
          </Link>
        </Button>
      </div>
    </div>
  );
}
