import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { FREE_TRIAL_LIMITS } from '@/lib/stripe-config';
import OpenAI from "openai";
import Papa from "papaparse";
import * as XLSX from "xlsx";
// @ts-ignore
import pdf from "pdf-extraction";
import { validateTransactions, formatFlags } from "@/lib/transaction-validator";
import type { ValidationReport } from "@/lib/transaction-validator";
import { getPCGCode } from "@/lib/accounting-formats";
import DOMPurify from "isomorphic-dompurify";
import { checkRateLimit } from "@/lib/rate-limiter";

// Client Supabase sans auth (pour free trial)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize OpenAI client for XAI Grok
const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// File validation with magic bytes
const VALID_FILE_SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  jpg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
};

function validateFileSignature(buffer: Buffer, type: string): boolean {
  const signature = VALID_FILE_SIGNATURES[type as keyof typeof VALID_FILE_SIGNATURES];
  if (!signature) return false;

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

function sanitizeDescription(desc: string): string {
  return DOMPurify.sanitize(desc, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
}

interface Transaction {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  category?: string;
  merchant?: string;
}

interface BankStatementResponse {
  bank_info: {
    bank_name: string;
    account_type: string;
    currency: string;
    account_number?: string;
    period?: string;
  };
  transactions: Transaction[];
}

/**
 * Hasher une IP de manière sécurisée (RGPD compliant)
 */
function hashIP(ip: string): string {
  const salt = process.env.IP_SALT || 'default-salt-change-me';
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex');
}

/**
 * Extraire l'IP réelle du client
 */
async function getClientIP(req: NextRequest): Promise<string> {
  const headersList = await headers();

  // Essayer différents headers (proxy, load balancer, etc.)
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headersList.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return '0.0.0.0';
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Récupérer l'IP et la hasher
    const clientIP = await getClientIP(req);
    const ipHash = hashIP(clientIP);

    console.log(`🔍 Free trial attempt from IP hash: ${ipHash.substring(0, 8)}...`);

    // 2. Vérifier le rate limiting (3 tentatives max par 5 minutes)
    const rateLimitResult = await checkRateLimit(ipHash);

    if (!rateLimitResult.allowed) {
      console.log(`🚫 Rate limit exceeded for IP hash: ${ipHash.substring(0, 8)}...`);
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.message || 'Too many requests. Please try again later.',
          remainingAttempts: 0,
          resetAt: rateLimitResult.resetAt?.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.resetAt
              ? Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000).toString()
              : '300',
          },
        }
      );
    }

    console.log(`✅ Rate limit check passed. Remaining attempts: ${rateLimitResult.remainingAttempts}`);

    // 3. Vérifier si cette IP a déjà utilisé son essai gratuit
    const { data: existingTrial, error: trialError } = await supabase
      .from('free_trial_ips')
      .select('*')
      .eq('ip_hash', ipHash)
      .single();

    if (existingTrial) {
      console.log(`❌ IP has already used free trial`);
      return NextResponse.json(
        {
          error: 'TRIAL_LIMIT_REACHED',
          message: 'You have already used your free trial. Please sign up to continue converting files!',
        },
        { status: 403 }
      );
    }

    // 4. Parser le fichier uploadé
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 5. Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size);

    // Convert file to buffer for validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file signature (magic bytes)
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    if (isPDF && !validateFileSignature(buffer, 'pdf')) {
      return NextResponse.json({ error: "Invalid PDF file format" }, { status: 400 });
    } else if (file.type === "image/jpeg" && !validateFileSignature(buffer, 'jpg')) {
      return NextResponse.json({ error: "Invalid JPEG file format" }, { status: 400 });
    } else if (file.type === "image/png" && !validateFileSignature(buffer, 'png')) {
      return NextResponse.json({ error: "Invalid PNG file format" }, { status: 400 });
    }

    if (!isPDF && !isImage) {
      return NextResponse.json({ error: "Only PDF, JPG, and PNG files are allowed" }, { status: 400 });
    }

    // 6. Extraire le nombre de pages
    let pageCount = 1;

    if (isPDF) {
      try {
        const pdfParse = (await import('pdf-parse')) as any;
        const data = await pdfParse(buffer);
        pageCount = data.numpages || 1;
        console.log(`📄 PDF has ${pageCount} page(s)`);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        // Continuer avec pageCount = 1 si erreur
      }
    }

    // 7. Vérifier la limite de pages pour l'essai gratuit
    if (pageCount > FREE_TRIAL_LIMITS.max_pages) {
      return NextResponse.json(
        {
          error: 'FILE_TOO_LARGE',
          message: `Free trial is limited to ${FREE_TRIAL_LIMITS.max_pages} pages. This file has ${pageCount} pages. Please sign up for unlimited conversions!`,
          pageCount,
          maxPages: FREE_TRIAL_LIMITS.max_pages,
        },
        { status: 413 }
      );
    }

    console.log(`✅ File validated: ${pageCount} page(s)`);

    // 8. EXTRACTION AVEC LE VRAI SYSTÈME XAI GROK
    let extractedText = "";

    if (isImage) {
      console.log("Processing image with grok-4-fast-reasoning...");
      extractedText = "[IMAGE_FILE]";
    } else {
      console.log("Extracting text from PDF...");
      try {
        const data = await pdf(buffer);
        extractedText = data.text || "";
        console.log("PDF extracted text length:", extractedText.length);

        if (!extractedText || extractedText.trim().length < 10) {
          return NextResponse.json(
            { error: "No text found in PDF. The PDF might be empty, encrypted, or scanned." },
            { status: 400 }
          );
        }
      } catch (pdfError) {
        console.error("PDF extraction error:", pdfError);
        return NextResponse.json(
          { error: "Failed to extract text from PDF. Please ensure the PDF is not encrypted or corrupted." },
          { status: 400 }
        );
      }
    }

    console.log("Sending to Grok AI for analysis...");

    // Ultra-contextual and intelligent prompt (EXACT COPY FROM process-pdf)
    const prompt = `You are an ELITE financial data extraction AI with PERFECT accuracy across ALL languages, countries, and bank statement formats worldwide.

🎯 YOUR MISSION:
Analyze this bank statement with SURGICAL PRECISION. Your goal is to extract EVERY SINGLE transaction with 100% accuracy, automatically adapting to the document's language, format, currency, and structure.

📋 INTELLIGENT CONTEXT ANALYSIS (Do this AUTOMATICALLY):

1. **LANGUAGE DETECTION**:
   - Automatically detect the document language (French, English, Spanish, German, Italian, Portuguese, Arabic, Chinese, Japanese, Korean, Russian, Dutch, Swedish, etc.)
   - Adapt ALL your processing to this language
   - Understand local date formats, number formats, and banking terminology

2. **BANK IDENTIFICATION**:
   - Analyze headers, logos, formatting to identify the exact bank
   - Common banks: BNP Paribas, Crédit Agricole, Société Générale, LCL, Caisse d'Épargne, Boursouma, N26, Revolut, Qonto, Wise, Chase, Bank of America, Wells Fargo, HSBC, Barclays, Deutsche Bank, Santander, BBVA, and 1000+ other banks worldwide
   - If unknown: extract the bank name from the document header

3. **FORMAT ADAPTATION**:
   - Detect the statement layout structure automatically
   - Common patterns:
     * French: Date | Libellé | Débit | Crédit | Solde
     * English: Date | Description | Debit | Credit | Balance
     * German: Datum | Beschreibung | Soll | Haben | Saldo
     * Spanish: Fecha | Descripción | Cargo | Abono | Saldo
   - Handle multi-column, single-column, or tabular formats
   - Adapt to PDF text, scanned images, or structured tables

4. **CURRENCY & NUMBER FORMAT**:
   - Auto-detect currency (€, $, £, CHF, ¥, etc.)
   - Handle European format (1.234,56) vs US format (1,234.56)
   - Convert ALL amounts to standard decimal XX.XX format
   - Detect currency symbol position (before/after amount)

5. **DATE FORMAT INTELLIGENCE**:
   - Auto-detect: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD.MM.YYYY, etc.
   - Convert ALL dates to YYYY-MM-DD format
   - Handle abbreviated months in any language (Jan, Fév, Ene, etc.)

🔍 EXTRACTION RULES (CRITICAL):

1. **COMPLETENESS**: Extract EVERY transaction visible in the document - NO EXCEPTIONS
2. **ACCURACY**: Each amount must be EXACT to the cent/penny
3. **NORMALIZATION**:
   - Clean merchant names: "CARREFOUR 1234 PARIS" → "Carrefour"
   - Standardize descriptions: remove excessive codes/IDs
   - Auto-categorize intelligently based on merchant/description

4. **SMART CATEGORIZATION**:
   - food: Supermarkets, restaurants, cafés (Carrefour, Auchan, McDonald's, etc.)
   - transport: Gas stations, public transport, taxis, Uber (Shell, RATP, Uber, etc.)
   - shopping: Retail, online shopping (Amazon, Zara, Fnac, etc.)
   - salary: Salary payments, wages (keywords: SALAIRE, SALARY, VIREMENT)
   - transfer: Bank transfers, wire transfers (VIR, VIREMENT, TRANSFER)
   - bills: Utilities, phone, internet (EDF, Orange, SFR, etc.)
   - subscription: Netflix, Spotify, gym memberships
   - health: Pharmacies, doctors, medical
   - entertainment: Cinema, concerts, leisure
   - insurance: Insurance payments
   - other: Anything that doesn't fit above

5. **CONTEXTUAL UNDERSTANDING**:
   - Understand local terminology (e.g., "CB" in France = card payment)
   - Recognize payment methods (card, wire transfer, direct debit, check)
   - Detect recurring payments vs one-time transactions

📤 OUTPUT FORMAT (STRICT JSON):

Return ONLY a valid JSON object with this EXACT structure:

{
  "bank_info": {
    "bank_name": "Exact bank name from document",
    "account_type": "checking|credit_card|savings|business",
    "currency": "EUR|USD|GBP|CHF|etc",
    "account_number": "Last 4 digits or masked account number",
    "period": "MM/YYYY or date range"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Clean, normalized description",
      "debit": "XX.XX or empty string",
      "credit": "XX.XX or empty string",
      "balance": "XX.XX or empty string if unavailable",
      "category": "auto-detected category",
      "merchant": "Cleaned merchant name or empty string"
    }
  ]
}

⚠️ CRITICAL REQUIREMENTS:
- Return ONLY the JSON object (no markdown, no code blocks, no explanations)
- Extract transactions in chronological order (oldest to newest)
- If a field is unavailable, use empty string "" (never null or undefined)
- All amounts must be positive numbers as strings (e.g., "123.45")
- Debit = money OUT, Credit = money IN

📄 DOCUMENT TO ANALYZE:
${extractedText}

🚀 BEGIN EXTRACTION NOW. Return ONLY the JSON object.`;

    // Use ONLY grok-4-fast-reasoning for ALL processing (PDFs AND images)
    let completion;

    if (isImage) {
      const base64Image = buffer.toString("base64");
      const imageType = file.type === "image/png" ? "png" : "jpeg";

      completion = await openai.chat.completions.create({
        model: "grok-4-fast-reasoning",
        messages: [
          {
            role: "system",
            content:
              "You are an ELITE financial AI with PERFECT contextual understanding. You automatically detect document language, bank format, currency, and adapt your entire extraction process accordingly. You understand French banking (CB, VIREMENT, SALAIRE), English banking (DD, SO, CHQ), German (Überweisung, Lastschrift), Spanish (Transferencia, Domiciliación), and ALL other languages/formats worldwide. You extract EVERY transaction with surgical precision, intelligently categorize them, normalize merchant names, and return ONLY pure JSON without ANY markdown or explanations. Your accuracy rate is 100%.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt.replace("${extractedText}", "Please analyze this bank statement image."),
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/${imageType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 16384,
      });
    } else {
      completion = await openai.chat.completions.create({
        model: "grok-4-fast-reasoning",
        messages: [
          {
            role: "system",
            content:
              "You are an ELITE financial AI with PERFECT contextual understanding. You automatically detect document language, bank format, currency, and adapt your entire extraction process accordingly. You understand French banking (CB, VIREMENT, SALAIRE), English banking (DD, SO, CHQ), German (Überweisung, Lastschrift), Spanish (Transferencia, Domiciliación), and ALL other languages/formats worldwide. You extract EVERY transaction with surgical precision, intelligently categorize them, normalize merchant names, and return ONLY pure JSON without ANY markdown or explanations. Your accuracy rate is 100%.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 16384,
      });
    }

    const aiResponse = completion.choices[0]?.message?.content || "{}";
    console.log("AI Response received, length:", aiResponse.length);

    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    }

    let parsedData: BankStatementResponse;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "L'IA n'a pas pu analyser le document. La réponse n'est pas au format JSON valide." },
        { status: 500 }
      );
    }

    // Sanitize all transaction descriptions to prevent XSS
    const transactions: Transaction[] = (parsedData.transactions || []).map(t => ({
      ...t,
      description: sanitizeDescription(t.description),
      merchant: t.merchant ? sanitizeDescription(t.merchant) : t.merchant
    }));

    const bankInfo = parsedData.bank_info || {
      bank_name: "Unknown",
      account_type: "checking",
      currency: "EUR",
    };

    console.log("Detected Bank:", bankInfo.bank_name);
    console.log("Extracted transactions:", transactions.length);

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found in the statement" },
        { status: 400 }
      );
    }

    // 9. VALIDATION ET GÉNÉRATION EXCEL (EXACT COPY FROM process-pdf)
    console.log("Running validation and anomaly detection...");
    const validationReport: ValidationReport = validateTransactions(transactions);

    const transactionsWithFlags = validationReport.transactions;

    // Generate CSV with all fields
    const csvColumns = ["date", "code_pcg", "description", "debit", "credit", "balance"];

    if (transactions.some(t => t.category)) {
      csvColumns.push("category");
    }
    if (transactions.some(t => t.merchant)) {
      csvColumns.push("merchant");
    }
    csvColumns.push("notes");

    const csvData = transactionsWithFlags.map(t => ({
      date: t.date,
      code_pcg: getPCGCode(t),
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      balance: t.balance,
      ...(t.category && { category: t.category }),
      ...(t.merchant && { merchant: t.merchant }),
      notes: formatFlags(t.flags),
    }));

    const csv = Papa.unparse(csvData, {
      columns: csvColumns,
    });

    // Generate Excel with color coding and Code PCG
    const excelData = transactionsWithFlags.map(t => ({
      Date: t.date,
      "Code PCG": getPCGCode(t),
      Description: t.description,
      Debit: t.debit,
      Credit: t.credit,
      Balance: t.balance,
      ...(t.category && { Category: t.category }),
      ...(t.merchant && { Merchant: t.merchant }),
      Notes: formatFlags(t.flags),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Apply color coding to rows based on validation flags
    transactionsWithFlags.forEach((transaction, index) => {
      if (transaction.rowColor) {
        const rowIndex = index + 2;
        const columns = Object.keys(excelData[0]);
        columns.forEach((col, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIndex });
          if (!worksheet[cellAddress]) return;

          if (!worksheet[cellAddress].s) {
            worksheet[cellAddress].s = {};
          }
          worksheet[cellAddress].s.fill = {
            fgColor: { rgb: transaction.rowColor?.replace("#", "") || "FFFFFF" },
          };
        });
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const excelBase64 = excelBuffer.toString("base64");

    const fileName = `converted_${file.name.replace(/\.(pdf|png|jpg|jpeg)$/i, '.xlsx')}`;

    // 10. Si succès, enregistrer l'IP pour bloquer les futurs essais
    const { error: insertError } = await supabase
      .from('free_trial_ips')
      .insert({
        ip_hash: ipHash,
        conversions_count: 1,
        last_conversion_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error logging free trial IP:', insertError);
    }

    console.log(`🎉 Free trial conversion completed successfully in ${Date.now() - startTime}ms`);

    // 11. Retourner le résultat COMPLET avec le vrai Excel
    return NextResponse.json({
      success: true,
      fileName,
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${excelBase64}`,
      pageCount,
      bank_info: bankInfo,
      transactions,
      validation: {
        totalTransactions: validationReport.totalTransactions,
        duplicatesCount: validationReport.duplicatesCount,
        anomaliesCount: validationReport.anomaliesCount,
        balanceVerified: validationReport.balanceVerified,
      },
      isFreeTrial: true,
      message: 'Free trial used! Sign up for unlimited conversions.',
    });

  } catch (error) {
    console.error('❌ Error in free trial conversion:', error);
    return NextResponse.json(
      { error: 'Failed to process free trial conversion' },
      { status: 500 }
    );
  }
}
