#!/bin/bash

# Script pour configurer automatiquement les variables d'environnement Vercel
# Pour BS Convert Production

echo "🚀 Configuration des variables d'environnement Vercel pour BS Convert"
echo "=================================================================="

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé."
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "🔑 Configuration des variables d'environnement en PRODUCTION..."
echo ""

# NEXT_PUBLIC_BASE_URL
echo "✓ NEXT_PUBLIC_BASE_URL"
vercel env add NEXT_PUBLIC_BASE_URL production <<EOF
https://bsconvert.com
EOF

# STRIPE_WEBHOOK_SECRET
echo "✓ STRIPE_WEBHOOK_SECRET"
vercel env add STRIPE_WEBHOOK_SECRET production <<EOF
whsec_T9xNpIPTxOllKMJhiIMH6izlQRXQfDvc
EOF

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Aller sur Stripe Dashboard et activer le Billing Portal"
echo "2. Aller sur Supabase Dashboard et configurer les URLs d'authentification"
echo ""
