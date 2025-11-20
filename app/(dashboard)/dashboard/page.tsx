"use client";

import * as React from "react";
import type { Metadata } from "next";
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useConversions } from "@/lib/hooks/useConversions";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { CreditsDisplay } from "@/components/credits-display";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 172800) return "Hier";
  if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const { conversions, loading: conversionsLoading, error: conversionsError } = useConversions(5);
  const { stats, bankDistribution, monthlyActivity, loading: statsLoading, error: statsError } = useDashboardStats();
  const [verifyingPayment, setVerifyingPayment] = React.useState(false);

  const loading = conversionsLoading || statsLoading;
  const error = conversionsError || statsError;

  // Vérifier et activer l'abonnement après paiement Stripe
  React.useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId || verifyingPayment) return;

      setVerifyingPayment(true);

      try {
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          // Supprimer session_id de l'URL
          window.history.replaceState({}, '', '/dashboard');

          // Recharger la page pour afficher les nouvelles données
          window.location.reload();
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
      } finally {
        setVerifyingPayment(false);
      }
    };

    verifyPayment();
  }, [verifyingPayment]);

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

  const statsData = [
    {
      title: "Conversions totales",
      value: loading ? "..." : stats?.totalConversions.toLocaleString() || "0",
      change: loading ? "..." : stats?.monthlyGrowth || "0%",
      icon: FileText,
    },
    {
      title: "Ce mois",
      value: loading ? "..." : stats?.monthConversions.toLocaleString() || "0",
      change: loading ? "..." : stats?.monthlyGrowth || "0%",
      icon: TrendingUp,
    },
    {
      title: "Réussies",
      value: loading ? "..." : stats?.successfulConversions.toLocaleString() || "0",
      change: loading ? "..." : stats?.successRate || "0%",
      icon: CheckCircle2,
    },
    {
      title: "En attente",
      value: loading ? "..." : stats?.pendingConversions.toString() || "0",
      change: "0",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Suivez vos conversions et performances en temps réel
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/convert">
            <FileText className="h-4 w-4" />
            Nouvelle conversion
          </Link>
        </Button>
      </div>

      {/* Credits Display - Prominent */}
      <CreditsDisplay variant="full" showUpgradeButton={true} />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-smooth hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold">{stat.value}</div>
                <p className="mt-1 flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  {stat.change} vs mois dernier
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité mensuelle</CardTitle>
            <CardDescription>
              Nombre de conversions par mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : monthlyActivity.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyActivity.map((item) => (
                  <div key={item.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.month}</span>
                      <span className="font-mono font-medium">{item.count}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banques détectées</CardTitle>
            <CardDescription>
              Répartition par institution bancaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : bankDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-4">
                {bankDistribution.map((item) => (
                  <div key={item.bank} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.bank}</span>
                      <span className="font-mono font-medium">{item.count}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversions récentes</CardTitle>
              <CardDescription>
                Vos dernières conversions de relevés bancaires
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/history">Voir tout</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : conversions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">Aucune conversion pour le moment</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Commencez par télécharger votre premier relevé bancaire
                </p>
              </div>
              <Button asChild>
                <Link href="/convert">Nouvelle conversion</Link>
              </Button>
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
                {conversions.map((conversion) => (
                  <TableRow key={conversion.id} className="hover:bg-accent/50 transition-smooth">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{conversion.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>{conversion.bank_name || "Inconnu"}</TableCell>
                    <TableCell className="font-mono">{conversion.transaction_count}</TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {formatTimeAgo(conversion.created_at)}
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
