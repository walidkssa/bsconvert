"use client";

import * as React from "react";
import {
  Lock,
  Loader2,
  CheckCircle2,
  Mail,
  KeyRound,
  CreditCard,
  ExternalLink,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase-client";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [loadingPortal, setLoadingPortal] = React.useState(false);

  // User info state
  const [userId, setUserId] = React.useState("");
  const [userProfile, setUserProfile] = React.useState<any>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
          setUserId(user.id);

          // Fetch user profile with subscription info
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          setUserProfile(profile);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations utilisateur",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [toast]);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to create portal session`);
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'ouvrir le portail de gestion",
        variant: "destructive",
      });
      setLoadingPortal(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de changer le mot de passe",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold">Chargement...</h2>
          <p className="text-muted-foreground">
            Récupération de vos paramètres
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-2 text-muted-foreground">
          Gérez vos informations personnelles et préférences de compte
        </p>
      </div>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Abonnement</CardTitle>
          </div>
          <CardDescription>
            Gérez votre abonnement, changez de formule ou annulez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Subscription Status */}
            <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
              <div>
                <p className="text-sm font-medium mb-1">Statut de l'abonnement</p>
                <div className="flex items-center gap-2">
                  {userProfile?.subscription_status === 'active' ? (
                    <>
                      <Badge className="bg-green-600 hover:bg-green-700">Actif</Badge>
                      <span className="text-sm text-muted-foreground">
                        Plan {userProfile?.plan_tier || 'Non défini'}
                      </span>
                    </>
                  ) : (
                    <Badge variant="outline">Aucun abonnement</Badge>
                  )}
                </div>
              </div>
              {userProfile?.subscription_status === 'active' && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Crédits restants</p>
                  <p className="text-2xl font-bold">
                    {(userProfile?.credits_monthly_limit || 0) - (userProfile?.credits_used_this_month || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    sur {userProfile?.credits_monthly_limit?.toLocaleString() || '0'} pages
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Manage Subscription Button */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {userProfile?.subscription_status === 'active'
                  ? "Gérez votre abonnement depuis le portail Stripe. Vous pouvez changer de formule, mettre à jour votre moyen de paiement, consulter vos factures ou annuler votre abonnement."
                  : "Vous n'avez pas encore d'abonnement actif. Souscrivez à une formule pour commencer à convertir vos relevés bancaires."}
              </p>

              <Button
                onClick={handleManageSubscription}
                disabled={loadingPortal || !userProfile?.stripe_customer_id}
                className="w-full sm:w-auto gap-2"
              >
                {loadingPortal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ouverture du portail...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {userProfile?.subscription_status === 'active'
                      ? 'Gérer mon abonnement'
                      : 'Choisir une formule'}
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </Button>

              {userProfile?.subscription_status === 'active' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <strong>Important:</strong> Les modifications d'abonnement sont gérées par Stripe.
                    Vos crédits seront automatiquement mis à jour en fonction de votre nouvelle formule.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Sécurité</CardTitle>
          </div>
          <CardDescription>
            Modifiez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 caractères
              </p>
            </div>

            <Separator />

            <Button
              type="submit"
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full sm:w-auto"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification en cours...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Modifier le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Détails de votre utilisation de BS Convert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Compte vérifié</span>
              </div>
              <span className="text-sm font-medium">Oui</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email vérifié</span>
              </div>
              <span className="text-sm font-medium">Oui</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
