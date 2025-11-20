"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Info } from "lucide-react";
import type { AccountingConfig } from "@/lib/accounting-formats";
import { DEFAULT_BANK_CONFIG } from "@/lib/accounting-formats";

interface AccountingConfigFormProps {
  onSubmit: (config: AccountingConfig) => void;
  onCancel: () => void;
}

export default function AccountingConfigForm({ onSubmit, onCancel }: AccountingConfigFormProps) {
  const [config, setConfig] = useState<AccountingConfig>(DEFAULT_BANK_CONFIG);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation basique
    const newErrors: string[] = [];

    if (!config.journalCode) newErrors.push("Le code journal est requis");
    if (!config.journalLib) newErrors.push("Le libellé du journal est requis");
    if (!config.accountNum || !/^\d{6,}$/.test(config.accountNum)) {
      newErrors.push("Le numéro de compte doit contenir au moins 6 chiffres");
    }
    if (!config.accountLib) newErrors.push("Le libellé du compte est requis");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onSubmit(config);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Configuration Comptable
        </CardTitle>
        <CardDescription>
          Configurez les paramètres pour l'intégration dans votre logiciel comptable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code Journal */}
          <div className="space-y-2">
            <Label htmlFor="journalCode">
              Code Journal <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="journalCode"
              value={config.journalCode}
              onChange={(e) => setConfig({ ...config, journalCode: e.target.value.toUpperCase() })}
              placeholder="BQ"
              maxLength={4}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Code du journal comptable (ex: BQ pour Banque, CA pour Caisse)
            </p>
          </div>

          {/* Libellé Journal */}
          <div className="space-y-2">
            <Label htmlFor="journalLib">
              Libellé Journal <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="journalLib"
              value={config.journalLib}
              onChange={(e) => setConfig({ ...config, journalLib: e.target.value })}
              placeholder="Banque"
            />
            <p className="text-xs text-muted-foreground">
              Description du journal (ex: Banque, Caisse, Achats)
            </p>
          </div>

          {/* Numéro de Compte */}
          <div className="space-y-2">
            <Label htmlFor="accountNum">
              Numéro de Compte Général <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="accountNum"
              value={config.accountNum}
              onChange={(e) => setConfig({ ...config, accountNum: e.target.value.replace(/\D/g, "") })}
              placeholder="512000"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Compte du plan comptable (ex: 512000 pour Banque)
            </p>
          </div>

          {/* Libellé du Compte */}
          <div className="space-y-2">
            <Label htmlFor="accountLib">
              Libellé du Compte <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="accountLib"
              value={config.accountLib}
              onChange={(e) => setConfig({ ...config, accountLib: e.target.value })}
              placeholder="Banque"
            />
          </div>

          {/* Préfixe Compte Auxiliaire (Optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="auxAccountPrefix">
              Préfixe Compte Auxiliaire <span className="text-muted-foreground">(Optionnel)</span>
            </Label>
            <Input
              id="auxAccountPrefix"
              value={config.auxAccountPrefix || ""}
              onChange={(e) => setConfig({ ...config, auxAccountPrefix: e.target.value })}
              placeholder="401"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Pour les comptes fournisseurs/clients (ex: 401 pour fournisseurs)
            </p>
          </div>

          {/* Erreurs de validation */}
          {errors.length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Erreurs de validation</p>
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-muted border rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Conseils :</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Utilisez les mêmes codes que dans votre logiciel comptable</li>
                  <li>• Les transactions seront automatiquement catégorisées selon le plan comptable français</li>
                  <li>• Vous pourrez ajuster les écritures dans votre logiciel après import</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Générer le Fichier
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
