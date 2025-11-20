"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationSummaryProps {
  validation: {
    totalTransactions: number;
    duplicatesCount: number;
    anomaliesCount: number;
    totalDebit: number;
    totalCredit: number;
    balanceVerified: boolean;
    summary: string[];
  };
}

export default function ValidationSummary({ validation }: ValidationSummaryProps) {
  const hasErrors = !validation.balanceVerified;
  const hasWarnings = validation.duplicatesCount > 0 || validation.anomaliesCount > 0;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Rapport de Validation
        </CardTitle>
        <CardDescription>
          Vérification automatique des doublons, anomalies et totaux
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Alerts */}
        {hasErrors && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erreurs détectées</AlertTitle>
            <AlertDescription>
              Des incohérences ont été trouvées dans les totaux. Vérifiez les transactions marquées.
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && !hasErrors && (
          <Alert className="border-foreground/20 bg-muted">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Avertissements détectés</AlertTitle>
            <AlertDescription>
              {validation.duplicatesCount > 0 && `${validation.duplicatesCount} doublon(s) détecté(s). `}
              {validation.anomaliesCount > 0 && `${validation.anomaliesCount} anomalie(s) détectée(s). `}
              Consultez les transactions marquées pour plus de détails.
            </AlertDescription>
          </Alert>
        )}

        {!hasErrors && !hasWarnings && (
          <Alert className="border-foreground/20 bg-accent">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Aucun problème détecté</AlertTitle>
            <AlertDescription>
              Toutes les transactions ont été vérifiées avec succès.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-2xl font-mono font-bold">{validation.totalTransactions}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Doublons</p>
            <p className={`text-2xl font-mono font-bold ${validation.duplicatesCount > 0 ? "text-muted-foreground" : ""}`}>
              {validation.duplicatesCount}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Anomalies</p>
            <p className={`text-2xl font-mono font-bold ${validation.anomaliesCount > 0 ? "text-muted-foreground" : ""}`}>
              {validation.anomaliesCount}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Totaux</p>
            <p className="text-2xl font-mono font-bold">
              {validation.balanceVerified ? "✓" : "✗"}
            </p>
          </div>
        </div>

        {/* Detailed Summary */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-semibold">Détails:</p>
          <div className="space-y-1">
            {validation.summary.map((line, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Legend - Updated to monochrome */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-semibold">Légende:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-destructive" />
              <span className="text-muted-foreground">Erreur</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-muted" />
              <span className="text-muted-foreground">Avertissement</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
