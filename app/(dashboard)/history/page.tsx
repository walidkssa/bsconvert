"use client";

import * as React from "react";
import { FileText, Download, Search, Filter, Calendar, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversions } from "@/lib/hooks/useConversions";

export default function HistoryPage() {
  const { conversions, loading, error } = useConversions();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredConversions, setFilteredConversions] = React.useState(conversions);

  React.useEffect(() => {
    if (searchQuery && conversions) {
      const filtered = conversions.filter(
        (conv) =>
          conv.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (conv.bank_name && conv.bank_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredConversions(filtered);
    } else {
      setFilteredConversions(conversions);
    }
  }, [searchQuery, conversions]);

  // Calculate stats
  const totalConversions = conversions.length;
  const totalTransactions = conversions.reduce((sum, conv) => sum + conv.transaction_count, 0);

  // This month conversions
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthConversions = conversions.filter(
    (conv) => new Date(conv.created_at) >= firstDayOfMonth
  ).length;

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Erreur de chargement</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Historique</h1>
          <p className="mt-2 text-muted-foreground">
            Retrouvez toutes vos conversions passées
          </p>
        </div>
        <Button asChild>
          <Link href="/convert">
            <FileText className="mr-2 h-4 w-4" />
            Nouvelle conversion
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-mono font-bold">{totalConversions.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-mono font-bold">{thisMonthConversions.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-mono font-bold">{totalTransactions.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Formats générés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-mono font-bold">{(totalConversions * 2).toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom de fichier ou banque..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrer
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Toutes les banques</DropdownMenuItem>
                  <DropdownMenuItem>BNP Paribas</DropdownMenuItem>
                  <DropdownMenuItem>Wise</DropdownMenuItem>
                  <DropdownMenuItem>Crédit Agricole</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Période
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Aujourd'hui</DropdownMenuItem>
                  <DropdownMenuItem>Cette semaine</DropdownMenuItem>
                  <DropdownMenuItem>Ce mois</DropdownMenuItem>
                  <DropdownMenuItem>Tout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conversions récentes</CardTitle>
          <CardDescription>
            {loading ? "Chargement..." : `${filteredConversions.length} conversion(s) trouvée(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">Aucune conversion trouvée</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? "Essayez avec d'autres critères de recherche"
                    : "Commencez par télécharger votre premier relevé bancaire"}
                </p>
              </div>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/">Nouvelle conversion</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Banque</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversions.map((conversion) => (
                  <TableRow key={conversion.id} className="hover:bg-accent/50 transition-smooth">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{conversion.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>{conversion.bank_name || "Inconnu"}</TableCell>
                    <TableCell className="font-mono">{conversion.transaction_count.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {new Date(conversion.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
