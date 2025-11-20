"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, CheckCircle2 } from "lucide-react";
import type { ExportFormat } from "@/lib/accounting-formats";

interface ExportFormatSelectorProps {
  onSelect: (format: ExportFormat) => void;
  downloadedFormats?: Set<ExportFormat>;
}

export default function ExportFormatSelector({ onSelect, downloadedFormats = new Set() }: ExportFormatSelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);

  const formats = [
    {
      id: "csv" as ExportFormat,
      name: "CSV Standard",
      description: "Format universel compatible avec Excel, Google Sheets",
    },
    {
      id: "excel" as ExportFormat,
      name: "Excel (XLSX)",
      description: "Fichier Excel avec formatage et colonnes structurées",
    },
    {
      id: "fec" as ExportFormat,
      name: "FEC Comptable",
      description: "Format légal français - Compatible TOUS logiciels",
      badge: "Recommandé",
    },
    {
      id: "sage" as ExportFormat,
      name: "Sage 100c",
      description: "Format optimisé pour Sage (import direct)",
    },
    {
      id: "cegid" as ExportFormat,
      name: "Cegid Loop",
      description: "Format JSON pour Cegid Loop API",
    },
    {
      id: "quickbooks" as ExportFormat,
      name: "QuickBooks",
      description: "Format CSV pour import QuickBooks",
    },
    {
      id: "xero" as ExportFormat,
      name: "Xero",
      description: "Format CSV pour import Xero",
    },
  ];

  const handleSelect = (formatId: string) => {
    const format = formatId as ExportFormat;
    setSelectedFormat(format);
    onSelect(format);
  };

  const selectedFormatData = formats.find(f => f.id === selectedFormat);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="format-select" className="text-base font-semibold">
              Sélectionnez le format d'export
            </Label>
            <p className="text-sm text-muted-foreground">
              Choisissez le format adapté à votre logiciel comptable
            </p>
          </div>

          <div className="flex gap-3">
            <Select value={selectedFormat || ""} onValueChange={handleSelect}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choisir un format..." />
              </SelectTrigger>
              <SelectContent>
                {formats.map((format) => {
                  const isDownloaded = downloadedFormats.has(format.id);
                  return (
                    <SelectItem key={format.id} value={format.id}>
                      <div className="flex items-center gap-2">
                        <span>{format.name}</span>
                        {format.badge && (
                          <span className="text-xs bg-accent px-1.5 py-0.5 rounded">
                            {format.badge}
                          </span>
                        )}
                        {isDownloaded && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button
              onClick={() => selectedFormat && onSelect(selectedFormat)}
              disabled={!selectedFormat}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
          </div>

          {selectedFormatData && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {selectedFormatData.description}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
