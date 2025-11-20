/**
 * Accounting Formats Library
 * Support for French accounting software integration (FEC, Sage, Cegid)
 */

import Papa from "papaparse";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ExportFormat = "csv" | "excel" | "fec" | "sage" | "cegid" | "quickbooks" | "xero";

export interface AccountingConfig {
  journalCode: string; // Code journal (ex: "BQ" pour banque)
  journalLib: string; // Libellé journal (ex: "Banque")
  accountNum: string; // Numéro de compte général (ex: "512000")
  accountLib: string; // Libellé du compte (ex: "Banque")
  auxAccountPrefix?: string; // Préfixe compte auxiliaire (ex: "401" pour fournisseurs)
}

export interface FECEntry {
  JournalCode: string; // Code journal
  JournalLib: string; // Libellé journal
  EcritureNum: string; // Numéro d'écriture
  EcritureDate: string; // Date d'écriture (YYYYMMDD)
  CompteNum: string; // Numéro de compte général
  CompteLib: string; // Libellé du compte
  CompAuxNum: string; // Numéro de compte auxiliaire
  CompAuxLib: string; // Libellé du compte auxiliaire
  PieceRef: string; // Référence de la pièce
  PieceDate: string; // Date de la pièce (YYYYMMDD)
  EcritureLib: string; // Libellé de l'écriture
  Debit: string; // Montant au débit
  Credit: string; // Montant au crédit
  EcritureLet: string; // Lettrage
  DateLet: string; // Date de lettrage
  ValidDate: string; // Date de validation
  Montantdevise: string; // Montant en devise
  Idevise: string; // Identifiant devise
}

export interface SageEntry {
  JournalCode: string;
  EcritureDate: string;
  CompteNum: string;
  CompAuxNum: string;
  EcritureLib: string;
  Debit: string;
  Credit: string;
  PieceRef: string;
}

export interface CegidEntry {
  date: string;
  journal: string;
  account: string;
  auxiliaryAccount?: string;
  label: string;
  debit: number;
  credit: number;
  reference: string;
  currency: string;
}

export interface Transaction {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  category?: string;
  merchant?: string;
}

// ============================================================================
// FEC FORMAT GENERATOR (Format Universel - Priorité #1)
// ============================================================================

/**
 * Génère un fichier FEC (Fichier des Écritures Comptables)
 * Format standardisé par l'administration fiscale française
 * Compatible avec TOUS les logiciels comptables français
 */
export function generateFEC(
  transactions: Transaction[],
  config: AccountingConfig
): string {
  const fecEntries: FECEntry[] = [];
  let ecritureNum = 1;

  transactions.forEach((transaction, index) => {
    const transactionDate = formatDateFEC(transaction.date);
    const currentEcritureNum = ecritureNum.toString().padStart(8, "0");

    // Montant de la transaction
    const debitValue = typeof transaction.debit === 'string'
      ? parseFloat(transaction.debit.replace(/[^\d.-]/g, ""))
      : (transaction.debit || 0);
    const creditValue = typeof transaction.credit === 'string'
      ? parseFloat(transaction.credit.replace(/[^\d.-]/g, ""))
      : (transaction.credit || 0);

    const amount = debitValue || creditValue || 0;
    const isDebit = debitValue !== 0;
    const debitAmount = isDebit ? Math.abs(amount).toFixed(2) : "0.00";
    const creditAmount = !isDebit ? Math.abs(amount).toFixed(2) : "0.00";

    // Ligne 1 : Compte de banque (contrepartie)
    fecEntries.push({
      JournalCode: config.journalCode,
      JournalLib: config.journalLib,
      EcritureNum: currentEcritureNum,
      EcritureDate: transactionDate,
      CompteNum: config.accountNum,
      CompteLib: config.accountLib,
      CompAuxNum: "",
      CompAuxLib: "",
      PieceRef: `${config.journalCode}${transactionDate}${index + 1}`,
      PieceDate: transactionDate,
      EcritureLib: cleanDescription(transaction.description),
      Debit: isDebit ? debitAmount : "0.00",
      Credit: !isDebit ? creditAmount : "0.00",
      EcritureLet: "",
      DateLet: "",
      ValidDate: transactionDate,
      Montantdevise: "",
      Idevise: "",
    });

    // Ligne 2 : Compte de charge/produit (selon catégorie)
    const categoryAccount = getCategoryAccount(transaction.category, isDebit);
    fecEntries.push({
      JournalCode: config.journalCode,
      JournalLib: config.journalLib,
      EcritureNum: currentEcritureNum,
      EcritureDate: transactionDate,
      CompteNum: categoryAccount.num,
      CompteLib: categoryAccount.lib,
      CompAuxNum: config.auxAccountPrefix || "",
      CompAuxLib: transaction.merchant || "",
      PieceRef: `${config.journalCode}${transactionDate}${index + 1}`,
      PieceDate: transactionDate,
      EcritureLib: cleanDescription(transaction.description),
      Debit: !isDebit ? debitAmount : "0.00",
      Credit: isDebit ? creditAmount : "0.00",
      EcritureLet: "",
      DateLet: "",
      ValidDate: transactionDate,
      Montantdevise: "",
      Idevise: "",
    });

    ecritureNum++;
  });

  // Générer le fichier FEC avec pipe (|) comme délimiteur
  const headers = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
  ];

  const rows = fecEntries.map((entry) =>
    headers.map((header) => entry[header as keyof FECEntry]).join("|")
  );

  return headers.join("|") + "\n" + rows.join("\n");
}

// ============================================================================
// SAGE FORMAT GENERATOR
// ============================================================================

/**
 * Génère un fichier compatible Sage (format simplifié)
 * Le cabinet peut ensuite configurer le mapping via un fichier .ema
 */
export function generateSage(
  transactions: Transaction[],
  config: AccountingConfig
): string {
  const sageEntries: SageEntry[] = [];

  transactions.forEach((transaction, index) => {
    const transactionDate = formatDateFEC(transaction.date);

    const debitValue = typeof transaction.debit === 'string'
      ? parseFloat(transaction.debit.replace(/[^\d.-]/g, ""))
      : (transaction.debit || 0);
    const creditValue = typeof transaction.credit === 'string'
      ? parseFloat(transaction.credit.replace(/[^\d.-]/g, ""))
      : (transaction.credit || 0);

    const amount = debitValue || creditValue || 0;
    const isDebit = debitValue !== 0;
    const debitAmount = isDebit ? Math.abs(amount).toFixed(2) : "0.00";
    const creditAmount = !isDebit ? Math.abs(amount).toFixed(2) : "0.00";

    // Ligne compte banque
    sageEntries.push({
      JournalCode: config.journalCode,
      EcritureDate: transactionDate,
      CompteNum: config.accountNum,
      CompAuxNum: "",
      EcritureLib: cleanDescription(transaction.description),
      Debit: isDebit ? debitAmount : "0.00",
      Credit: !isDebit ? creditAmount : "0.00",
      PieceRef: `${config.journalCode}${transactionDate}${index + 1}`,
    });

    // Ligne contrepartie
    const categoryAccount = getCategoryAccount(transaction.category, isDebit);
    sageEntries.push({
      JournalCode: config.journalCode,
      EcritureDate: transactionDate,
      CompteNum: categoryAccount.num,
      CompAuxNum: config.auxAccountPrefix || "",
      EcritureLib: cleanDescription(transaction.description),
      Debit: !isDebit ? debitAmount : "0.00",
      Credit: isDebit ? creditAmount : "0.00",
      PieceRef: `${config.journalCode}${transactionDate}${index + 1}`,
    });
  });

  // Format TAB-delimited pour Sage
  return Papa.unparse(sageEntries, {
    delimiter: "\t",
    header: true,
  });
}

// ============================================================================
// CEGID FORMAT GENERATOR (JSON)
// ============================================================================

/**
 * Génère un fichier JSON compatible Cegid Loop API
 */
export function generateCegid(
  transactions: Transaction[],
  config: AccountingConfig,
  currency: string = "EUR"
): string {
  const cegidEntries: CegidEntry[] = [];

  transactions.forEach((transaction) => {
    const debitValue = typeof transaction.debit === 'string'
      ? parseFloat(transaction.debit.replace(/[^\d.-]/g, ""))
      : (transaction.debit || 0);
    const creditValue = typeof transaction.credit === 'string'
      ? parseFloat(transaction.credit.replace(/[^\d.-]/g, ""))
      : (transaction.credit || 0);

    const amount = debitValue || creditValue || 0;
    const isDebit = debitValue !== 0;

    const categoryAccount = getCategoryAccount(transaction.category, isDebit);

    cegidEntries.push({
      date: transaction.date,
      journal: config.journalCode,
      account: config.accountNum,
      label: cleanDescription(transaction.description),
      debit: isDebit ? Math.abs(amount) : 0,
      credit: !isDebit ? Math.abs(amount) : 0,
      reference: transaction.merchant || "",
      currency: currency,
    });

    cegidEntries.push({
      date: transaction.date,
      journal: config.journalCode,
      account: categoryAccount.num,
      auxiliaryAccount: config.auxAccountPrefix,
      label: cleanDescription(transaction.description),
      debit: !isDebit ? Math.abs(amount) : 0,
      credit: isDebit ? Math.abs(amount) : 0,
      reference: transaction.merchant || "",
      currency: currency,
    });
  });

  return JSON.stringify(
    {
      entries: cegidEntries,
      metadata: {
        generated_at: new Date().toISOString(),
        format: "cegid-loop",
        version: "1.0",
      },
    },
    null,
    2
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formate une date au format FEC (YYYYMMDD)
 */
function formatDateFEC(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Nettoie la description pour le format comptable
 */
function cleanDescription(description: string): string {
  // Limite à 80 caractères et enlève les caractères spéciaux problématiques
  return description
    .substring(0, 80)
    .replace(/[|]/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .trim();
}

/**
 * Retourne le compte comptable selon la catégorie de transaction
 * Utilise le plan comptable français standard
 */
function getCategoryAccount(
  category: string | undefined,
  isDebit: boolean
): { num: string; lib: string } {
  // Si débit (sortie d'argent) = Charge (Classe 6)
  // Si crédit (entrée d'argent) = Produit (Classe 7)

  if (isDebit) {
    // CHARGES (Classe 6)
    switch (category) {
      case "food":
        return { num: "606100", lib: "Fournitures non stockables (Alimentation)" };
      case "transport":
        return { num: "625100", lib: "Déplacements, missions et réceptions" };
      case "shopping":
        return { num: "606400", lib: "Fournitures administratives" };
      case "subscription":
        return { num: "613000", lib: "Locations" };
      case "health":
        return { num: "616000", lib: "Assurances" };
      case "entertainment":
        return { num: "623700", lib: "Frais de réception" };
      case "bills":
      case "utilities":
        return { num: "626000", lib: "Frais postaux et de télécommunications" };
      case "insurance":
        return { num: "616000", lib: "Assurances" };
      case "transfer":
        return { num: "580000", lib: "Virements internes" };
      default:
        return { num: "628000", lib: "Autres charges externes" };
    }
  } else {
    // PRODUITS (Classe 7)
    switch (category) {
      case "salary":
        return { num: "708000", lib: "Produits des activités annexes" };
      case "transfer":
        return { num: "580000", lib: "Virements internes" };
      default:
        return { num: "758000", lib: "Produits divers de gestion courante" };
    }
  }
}

/**
 * Fonction publique pour obtenir le code PCG d'une transaction
 * Retourne le compte comptable selon la catégorie et le type de transaction
 */
export function getPCGCode(transaction: Transaction): string {
  const isDebit = !!transaction.debit && parseFloat(transaction.debit.replace(/[^\d.-]/g, "") || "0") !== 0;
  const account = getCategoryAccount(transaction.category, isDebit);
  return account.num;
}

/**
 * Fonction publique pour obtenir le libellé PCG complet d'une transaction
 */
export function getPCGLabel(transaction: Transaction): string {
  const isDebit = !!transaction.debit && parseFloat(transaction.debit.replace(/[^\d.-]/g, "") || "0") !== 0;
  const account = getCategoryAccount(transaction.category, isDebit);
  return `${account.num} - ${account.lib}`;
}

/**
 * Valide la configuration comptable
 */
export function validateAccountingConfig(config: AccountingConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.journalCode || config.journalCode.length === 0) {
    errors.push("Le code journal est obligatoire");
  }

  if (!config.journalLib || config.journalLib.length === 0) {
    errors.push("Le libellé du journal est obligatoire");
  }

  if (!config.accountNum || !/^\d{6,}$/.test(config.accountNum)) {
    errors.push("Le numéro de compte doit contenir au moins 6 chiffres");
  }

  if (!config.accountLib || config.accountLib.length === 0) {
    errors.push("Le libellé du compte est obligatoire");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Configuration par défaut pour les relevés bancaires
 */
export const DEFAULT_BANK_CONFIG: AccountingConfig = {
  journalCode: "BQ",
  journalLib: "Banque",
  accountNum: "512000",
  accountLib: "Banque",
  auxAccountPrefix: "",
};

// ============================================================================
// QUICKBOOKS FORMAT GENERATOR
// ============================================================================

export interface QuickBooksEntry {
  Date: string;
  Description: string;
  Account: string;
  Debit: string;
  Credit: string;
  Name: string;
  Memo: string;
}

/**
 * Génère un fichier compatible QuickBooks (format IIF)
 * Format CSV spécial pour import dans QuickBooks
 */
export function generateQuickBooks(
  transactions: Transaction[],
  config: AccountingConfig
): string {
  const qbEntries: QuickBooksEntry[] = [];

  transactions.forEach((transaction) => {
    const debitValue = typeof transaction.debit === 'string'
      ? parseFloat(transaction.debit.replace(/[^\d.-]/g, ""))
      : (transaction.debit || 0);
    const creditValue = typeof transaction.credit === 'string'
      ? parseFloat(transaction.credit.replace(/[^\d.-]/g, ""))
      : (transaction.credit || 0);

    const amount = debitValue || creditValue || 0;
    const isDebit = debitValue !== 0;

    // Format date MM/DD/YYYY pour QuickBooks
    const date = new Date(transaction.date);
    const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

    qbEntries.push({
      Date: formattedDate,
      Description: cleanDescription(transaction.description),
      Account: config.accountLib,
      Debit: isDebit ? Math.abs(amount).toFixed(2) : "",
      Credit: !isDebit ? Math.abs(amount).toFixed(2) : "",
      Name: transaction.merchant || "",
      Memo: transaction.description.substring(0, 40),
    });
  });

  return Papa.unparse(qbEntries, {
    header: true,
  });
}

// ============================================================================
// XERO FORMAT GENERATOR
// ============================================================================

export interface XeroEntry {
  ContactName: string;
  EmailAddress: string;
  POAddressLine1: string;
  POAddressLine2: string;
  POAddressLine3: string;
  POAddressLine4: string;
  POCity: string;
  PORegion: string;
  POPostalCode: string;
  POCountry: string;
  InvoiceNumber: string;
  Reference: string;
  InvoiceDate: string;
  DueDate: string;
  Total: string;
  TaxTotal: string;
  InvoiceAmountPaid: string;
  InvoiceAmountDue: string;
  InventoryItemCode: string;
  Description: string;
  Quantity: string;
  UnitAmount: string;
  Discount: string;
  AccountCode: string;
  TaxType: string;
  TaxAmount: string;
  TrackingName1: string;
  TrackingOption1: string;
  TrackingName2: string;
  TrackingOption2: string;
  Currency: string;
}

/**
 * Génère un fichier compatible Xero (CSV import format)
 * Format pour import de bank transactions dans Xero
 */
export function generateXero(
  transactions: Transaction[],
  config: AccountingConfig,
  currency: string = "EUR"
): string {
  const xeroEntries: XeroEntry[] = [];

  transactions.forEach((transaction, index) => {
    const debitValue = typeof transaction.debit === 'string'
      ? parseFloat(transaction.debit.replace(/[^\d.-]/g, ""))
      : (transaction.debit || 0);
    const creditValue = typeof transaction.credit === 'string'
      ? parseFloat(transaction.credit.replace(/[^\d.-]/g, ""))
      : (transaction.credit || 0);

    const amount = debitValue || creditValue || 0;
    const isDebit = debitValue !== 0;

    // Format date DD/MM/YYYY pour Xero
    const date = new Date(transaction.date);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

    const categoryAccount = getCategoryAccount(transaction.category, isDebit);

    xeroEntries.push({
      ContactName: transaction.merchant || "Bank Transaction",
      EmailAddress: "",
      POAddressLine1: "",
      POAddressLine2: "",
      POAddressLine3: "",
      POAddressLine4: "",
      POCity: "",
      PORegion: "",
      POPostalCode: "",
      POCountry: "",
      InvoiceNumber: `BNK-${String(index + 1).padStart(5, '0')}`,
      Reference: `${config.journalCode}-${formatDateFEC(transaction.date)}`,
      InvoiceDate: formattedDate,
      DueDate: formattedDate,
      Total: Math.abs(amount).toFixed(2),
      TaxTotal: "0.00",
      InvoiceAmountPaid: Math.abs(amount).toFixed(2),
      InvoiceAmountDue: "0.00",
      InventoryItemCode: "",
      Description: cleanDescription(transaction.description),
      Quantity: "1",
      UnitAmount: Math.abs(amount).toFixed(2),
      Discount: "0",
      AccountCode: categoryAccount.num,
      TaxType: "Tax Exempt",
      TaxAmount: "0.00",
      TrackingName1: "",
      TrackingOption1: "",
      TrackingName2: "",
      TrackingOption2: "",
      Currency: currency,
    });
  });

  return Papa.unparse(xeroEntries, {
    header: true,
  });
}
