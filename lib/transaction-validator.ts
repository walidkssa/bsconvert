/**
 * Transaction Validation & Anomaly Detection Library
 * Détecte les doublons, anomalies et vérifie la cohérence des données
 */

export interface Transaction {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  category?: string;
  merchant?: string;
}

export interface TransactionWithFlags extends Transaction {
  flags?: ValidationFlag[];
  rowColor?: string; // Couleur pour highlight dans Excel/CSV
}

export interface ValidationFlag {
  type: "duplicate" | "anomaly" | "total_error" | "large_amount" | "suspicious";
  severity: "warning" | "error" | "info";
  message: string;
}

export interface ValidationReport {
  totalTransactions: number;
  duplicatesCount: number;
  anomaliesCount: number;
  totalDebit: number;
  totalCredit: number;
  balanceVerified: boolean;
  transactions: TransactionWithFlags[];
  summary: string[];
}

/**
 * Détecte les doublons exacts (même date, montant, description)
 */
function detectDuplicates(transactions: Transaction[]): Map<number, ValidationFlag> {
  const duplicates = new Map<number, ValidationFlag>();
  const seen = new Map<string, number[]>();

  transactions.forEach((transaction, index) => {
    const amount = transaction.debit || transaction.credit;
    const key = `${transaction.date}|${amount}|${transaction.description.trim().toLowerCase()}`;

    if (seen.has(key)) {
      const previousIndices = seen.get(key)!;

      // Marquer toutes les occurrences comme doublons
      previousIndices.forEach(prevIndex => {
        if (!duplicates.has(prevIndex)) {
          duplicates.set(prevIndex, {
            type: "duplicate",
            severity: "warning",
            message: `Doublon détecté (${previousIndices.length + 1} occurrences)`,
          });
        }
      });

      duplicates.set(index, {
        type: "duplicate",
        severity: "warning",
        message: `Doublon détecté (${previousIndices.length + 1} occurrences)`,
      });

      previousIndices.push(index);
    } else {
      seen.set(key, [index]);
    }
  });

  return duplicates;
}

/**
 * Détecte les montants anormalement élevés (outliers)
 */
function detectLargeAmounts(transactions: Transaction[]): Map<number, ValidationFlag> {
  const largeAmounts = new Map<number, ValidationFlag>();

  // Calculer les montants
  const amounts = transactions.map(t => {
    const amount = t.debit || t.credit;
    const amountStr = typeof amount === 'string' ? amount : String(amount || '0');
    return Math.abs(parseFloat(amountStr.replace(/[^\d.-]/g, "")) || 0);
  });

  // Calculer moyenne et écart-type
  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
  );

  // Détecter les montants > 3 écarts-types
  transactions.forEach((transaction, index) => {
    const amount = amounts[index];
    if (amount > mean + 3 * stdDev && amount > 1000) {
      largeAmounts.set(index, {
        type: "large_amount",
        severity: "info",
        message: `Montant inhabituellement élevé (${amount.toFixed(2)}€)`,
      });
    }
  });

  return largeAmounts;
}

/**
 * Détecte les anomalies dans les balances (soldes incohérents)
 */
function detectBalanceAnomalies(transactions: Transaction[]): Map<number, ValidationFlag> {
  const anomalies = new Map<number, ValidationFlag>();

  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1];
    const current = transactions[i];

    if (!prev.balance || !current.balance) continue;

    const prevBalanceStr = typeof prev.balance === 'string' ? prev.balance : String(prev.balance || '0');
    const currentBalanceStr = typeof current.balance === 'string' ? current.balance : String(current.balance || '0');
    const debitStr = typeof current.debit === 'string' ? current.debit : String(current.debit || '0');
    const creditStr = typeof current.credit === 'string' ? current.credit : String(current.credit || '0');

    const prevBalance = parseFloat(prevBalanceStr.replace(/[^\d.-]/g, "")) || 0;
    const currentBalance = parseFloat(currentBalanceStr.replace(/[^\d.-]/g, "")) || 0;
    const debit = parseFloat(debitStr.replace(/[^\d.-]/g, "")) || 0;
    const credit = parseFloat(creditStr.replace(/[^\d.-]/g, "")) || 0;

    // Calculer le solde attendu
    const expectedBalance = prevBalance - Math.abs(debit) + Math.abs(credit);
    const difference = Math.abs(expectedBalance - currentBalance);

    // Si différence > 0.01€ (erreur d'arrondi acceptable)
    if (difference > 0.01) {
      anomalies.set(i, {
        type: "anomaly",
        severity: "error",
        message: `Solde incohérent (attendu: ${expectedBalance.toFixed(2)}€, trouvé: ${currentBalance.toFixed(2)}€)`,
      });
    }
  }

  return anomalies;
}

/**
 * Détecte les transactions suspectes (patterns inhabituels)
 */
function detectSuspiciousTransactions(transactions: Transaction[]): Map<number, ValidationFlag> {
  const suspicious = new Map<number, ValidationFlag>();

  transactions.forEach((transaction, index) => {
    const rawAmount = transaction.debit || transaction.credit;
    const amountStr = typeof rawAmount === 'string' ? rawAmount : String(rawAmount || '0');
    const amount = Math.abs(parseFloat(amountStr.replace(/[^\d.-]/g, "")) || 0);
    const description = transaction.description.toLowerCase();

    // Montants ronds suspects (ex: exactement 1000.00, 5000.00)
    if (amount > 500 && amount % 100 === 0 && amount >= 1000) {
      if (description.includes("test") || description.includes("essai")) {
        suspicious.set(index, {
          type: "suspicious",
          severity: "warning",
          message: `Transaction test possible (${amount.toFixed(2)}€)`,
        });
      }
    }

    // Descriptions vagues suspectes
    const vagueTerms = ["divers", "autre", "xxx", "test", "erreur"];
    if (vagueTerms.some(term => description.includes(term)) && amount > 100) {
      suspicious.set(index, {
        type: "suspicious",
        severity: "info",
        message: `Description vague pour montant significatif`,
      });
    }
  });

  return suspicious;
}

/**
 * Vérifie la cohérence des totaux
 */
function verifyTotals(transactions: Transaction[]): {
  totalDebit: number;
  totalCredit: number;
  balanceVerified: boolean;
  errors: string[];
} {
  let totalDebit = 0;
  let totalCredit = 0;
  const errors: string[] = [];

  transactions.forEach(transaction => {
    const debit = Math.abs(parseFloat((transaction.debit || "0").replace(/[^\d.-]/g, "")) || 0);
    const credit = Math.abs(parseFloat((transaction.credit || "0").replace(/[^\d.-]/g, "")) || 0);

    totalDebit += debit;
    totalCredit += credit;
  });

  // Vérifier si le premier et dernier solde sont cohérents avec les totaux
  if (transactions.length > 1) {
    const firstBalance = parseFloat((transactions[0].balance || "0").replace(/[^\d.-]/g, "")) || 0;
    const lastBalance = parseFloat((transactions[transactions.length - 1].balance || "0").replace(/[^\d.-]/g, "")) || 0;

    const expectedChange = totalCredit - totalDebit;
    const actualChange = lastBalance - firstBalance;
    const difference = Math.abs(expectedChange - actualChange);

    if (difference > 0.01) {
      errors.push(
        `Incohérence totaux: variation attendue ${expectedChange.toFixed(2)}€, variation réelle ${actualChange.toFixed(2)}€`
      );
    }
  }

  return {
    totalDebit,
    totalCredit,
    balanceVerified: errors.length === 0,
    errors,
  };
}

/**
 * Assigne une couleur selon la sévérité des flags
 */
function getRowColor(flags: ValidationFlag[]): string | undefined {
  if (!flags || flags.length === 0) return undefined;

  const hasError = flags.some(f => f.severity === "error");
  const hasWarning = flags.some(f => f.severity === "warning");

  if (hasError) return "#FEE2E2"; // Rouge clair
  if (hasWarning) return "#FEF3C7"; // Jaune clair
  return "#DBEAFE"; // Bleu clair (info)
}

/**
 * Fonction principale de validation
 */
export function validateTransactions(transactions: Transaction[]): ValidationReport {
  // Détection de toutes les anomalies
  const duplicates = detectDuplicates(transactions);
  const largeAmounts = detectLargeAmounts(transactions);
  const balanceAnomalies = detectBalanceAnomalies(transactions);
  const suspicious = detectSuspiciousTransactions(transactions);
  const totals = verifyTotals(transactions);

  // Combiner tous les flags
  const transactionsWithFlags: TransactionWithFlags[] = transactions.map((transaction, index) => {
    const flags: ValidationFlag[] = [];

    if (duplicates.has(index)) flags.push(duplicates.get(index)!);
    if (largeAmounts.has(index)) flags.push(largeAmounts.get(index)!);
    if (balanceAnomalies.has(index)) flags.push(balanceAnomalies.get(index)!);
    if (suspicious.has(index)) flags.push(suspicious.get(index)!);

    return {
      ...transaction,
      flags: flags.length > 0 ? flags : undefined,
      rowColor: getRowColor(flags),
    };
  });

  // Compter les anomalies
  const duplicatesCount = Array.from(duplicates.keys()).length;
  const anomaliesCount =
    Array.from(largeAmounts.keys()).length +
    Array.from(balanceAnomalies.keys()).length +
    Array.from(suspicious.keys()).length;

  // Générer le résumé
  const summary: string[] = [];
  summary.push(`Total de transactions: ${transactions.length}`);
  summary.push(`Total Débit: ${totals.totalDebit.toFixed(2)}€`);
  summary.push(`Total Crédit: ${totals.totalCredit.toFixed(2)}€`);

  if (duplicatesCount > 0) {
    summary.push(`⚠️ ${duplicatesCount} doublons détectés`);
  }

  if (anomaliesCount > 0) {
    summary.push(`⚠️ ${anomaliesCount} anomalies détectées`);
  }

  if (!totals.balanceVerified) {
    summary.push(`❌ Incohérence dans les totaux`);
    totals.errors.forEach(error => summary.push(`  - ${error}`));
  } else {
    summary.push(`✅ Totaux vérifiés et cohérents`);
  }

  return {
    totalTransactions: transactions.length,
    duplicatesCount,
    anomaliesCount,
    totalDebit: totals.totalDebit,
    totalCredit: totals.totalCredit,
    balanceVerified: totals.balanceVerified,
    transactions: transactionsWithFlags,
    summary,
  };
}

/**
 * Formate les flags pour affichage dans une colonne "Notes"
 */
export function formatFlags(flags?: ValidationFlag[]): string {
  if (!flags || flags.length === 0) return "";

  return flags.map(flag => {
    const icon = flag.severity === "error" ? "❌" : flag.severity === "warning" ? "⚠️" : "ℹ️";
    return `${icon} ${flag.message}`;
  }).join(" | ");
}
