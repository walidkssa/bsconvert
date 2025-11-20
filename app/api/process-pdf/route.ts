// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Papa from "papaparse";
import * as XLSX from "xlsx";
// @ts-ignore
import pdf from "pdf-extraction";
import { validateTransactions, formatFlags } from "@/lib/transaction-validator";
import type { ValidationReport } from "@/lib/transaction-validator";
import { getPCGCode } from "@/lib/accounting-formats";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
// DOMPurify removed due to ESM compatibility issues on Vercel
// Sanitization will be done client-side instead

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

// Simple server-side sanitization without DOMPurify
function sanitizeDescription(desc: string): string {
  if (!desc) return '';
  // Remove potentially dangerous characters and scripts
  return desc
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 500); // Limit length
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let conversionId: string | null = null;

  // Create supabase client at the top level so it's accessible in catch block
  const supabase = await createClient();

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB max)
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

    // ========================================
    // CREDIT & SUBSCRIPTION VERIFICATION
    // ========================================

    // Check if this is a free trial request (no user_id required)
    const isFreeTrialRequest = request.headers.get('X-Free-Trial') === 'true';

    // Variable to store page count (calculated once)
    let pageCount = 1; // Par défaut 1 page pour les images

    if (!isFreeTrialRequest) {
      // For regular users: check subscription and credits
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_status, credits_monthly_limit, credits_used_this_month, plan_tier, billing_cycle')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 404 }
        );
      }

      // Vérifier que l'utilisateur a un abonnement actif
      if (profile.subscription_status !== 'active') {
        return NextResponse.json(
          {
            error: "SUBSCRIPTION_REQUIRED",
            message: "You need an active subscription to convert files. Please subscribe to a plan.",
            requiresUpgrade: true,
          },
          { status: 402 }
        );
      }

      // Extraire le nombre de pages du document (UNE SEULE FOIS)
      if (isPDF) {
        try {
          // Utiliser pdf-lib pour compter les pages (compatible Next.js)
          const { PDFDocument } = await import('pdf-lib');
          const pdfDoc = await PDFDocument.load(buffer);
          pageCount = pdfDoc.getPageCount();
          console.log(`📄 PDF has ${pageCount} page(s)`);
        } catch (error) {
          console.error('Error counting PDF pages:', error);
          console.error('Error details:', error);
          // Continuer avec pageCount = 1 en cas d'erreur
        }
      }

      // Calculer les crédits restants
      const creditsRemaining = (profile.credits_monthly_limit || 0) - (profile.credits_used_this_month || 0);

      // Vérifier si l'utilisateur a assez de crédits
      if (creditsRemaining < pageCount) {
        return NextResponse.json(
          {
            error: "INSUFFICIENT_CREDITS",
            message: `Not enough credits. You need ${pageCount} page(s) but only have ${creditsRemaining} remaining.`,
            required: pageCount,
            available: creditsRemaining,
            requiresUpgrade: true,
          },
          { status: 402 }
        );
      }

      console.log(`✅ Credit check passed: ${creditsRemaining} available, ${pageCount} needed`);
    }

    // Create initial conversion record (user_id will be set automatically by trigger)
    const { data: conversion, error: insertError } = await supabase
      .from("conversions")
      .insert({
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        status: "processing",
        transaction_count: 0,
      })
      .select()
      .single();

    if (insertError || !conversion) {
      console.error("Failed to create conversion record:", insertError);
      return NextResponse.json({ error: "Failed to create conversion record" }, { status: 500 });
    }

    conversionId = conversion.id;
    console.log("Created conversion record:", conversionId);

    let extractedText = "";

    if (isImage) {
      // Handle images - will be sent directly to grok-4-fast-reasoning
      console.log("Processing image with grok-4-fast-reasoning...");
      extractedText = "[IMAGE_FILE]";
    } else {
      // Handle PDFs with text extraction
      console.log("Extracting text from PDF...");
      try {
        const data = await pdf(buffer);
        extractedText = data.text || "";
        console.log("PDF extracted text length:", extractedText.length);

        if (!extractedText || extractedText.trim().length < 10) {
          // Update conversion status to failed
          if (conversionId) {
            await supabase
              .from("conversions")
              .update({
                status: "failed",
                error_message: "No text found in PDF. The PDF might be empty, encrypted, or scanned.",
                processing_time_ms: Date.now() - startTime,
              })
              .eq("id", conversionId);
          }
          return NextResponse.json(
            { error: "No text found in PDF. The PDF might be empty, encrypted, or scanned." },
            { status: 400 }
          );
        }
      } catch (pdfError) {
        console.error("PDF extraction error:", pdfError);
        // Update conversion status to failed
        if (conversionId) {
          await supabase
            .from("conversions")
            .update({
              status: "failed",
              error_message: "Failed to extract text from PDF. Please ensure the PDF is not encrypted or corrupted.",
              processing_time_ms: Date.now() - startTime,
            })
            .eq("id", conversionId);
        }
        return NextResponse.json(
          { error: "Failed to extract text from PDF. Please ensure the PDF is not encrypted or corrupted." },
          { status: 400 }
        );
      }
    }

    console.log("Sending to Grok AI for analysis...");

    // Ultra-contextual and intelligent prompt for ANY bank statement format
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
      // For images, send base64 data directly to grok-4-fast-reasoning
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
        max_tokens: 100000, // Maximum pour gérer tous les documents
      });
    } else {
      // For PDFs, use text-based analysis
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
        max_tokens: 100000, // Maximum pour gérer tous les documents
      });
    }

    const aiResponse = completion.choices[0]?.message?.content || "{}";
    console.log("AI Response received, length:", aiResponse.length);
    console.log("Finish reason:", completion.choices[0]?.finish_reason);

    console.log("Full AI Response preview:", aiResponse.substring(0, 1000) + "...");

    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    }

    console.log("Cleaned response:", cleanedResponse.substring(0, 500));

    let parsedData: BankStatementResponse;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Failed to parse response (first 500 chars):", cleanedResponse.substring(0, 500));
      console.error("Response length:", cleanedResponse.length);

      // Tenter de réparer le JSON tronqué
      let repairedResponse = cleanedResponse;

      // Si le JSON est incomplet, essayer de le fermer proprement
      if (cleanedResponse.includes('"transactions": [')) {
        // Compter les accolades ouvrantes et fermantes
        const openBraces = (cleanedResponse.match(/{/g) || []).length;
        const closeBraces = (cleanedResponse.match(/}/g) || []).length;
        const openBrackets = (cleanedResponse.match(/\[/g) || []).length;
        const closeBrackets = (cleanedResponse.match(/\]/g) || []).length;

        // Tenter de fermer les structures ouvertes
        if (openBrackets > closeBrackets) {
          repairedResponse = repairedResponse + ']';
        }
        if (openBraces > closeBraces) {
          for (let i = 0; i < (openBraces - closeBraces); i++) {
            repairedResponse = repairedResponse + '}';
          }
        }

        console.log("Attempting to repair JSON...");
        try {
          parsedData = JSON.parse(repairedResponse);
          console.log("✅ JSON repaired successfully!");
        } catch (repairError) {
          console.error("❌ Failed to repair JSON");
          throw parseError; // Rethrow l'erreur originale
        }
      } else {
        throw parseError;
      }

      // Si on arrive ici sans avoir parsé, on a un problème
      if (!parsedData) {
        if (conversionId) {
          await supabase
            .from("conversions")
            .update({
              status: "failed",
              error_message: "Le document contient trop de transactions. Veuillez utiliser un relevé mensuel plutôt qu'annuel.",
              processing_time_ms: Date.now() - startTime,
            })
            .eq("id", conversionId);
        }

        return NextResponse.json(
          { error: "Le document contient trop de transactions. Veuillez utiliser un relevé mensuel (maximum 3 mois) plutôt qu'un relevé annuel." },
          { status: 400 }
        );
      }
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
    console.log("Account Type:", bankInfo.account_type);
    console.log("Currency:", bankInfo.currency);
    console.log("Extracted transactions:", transactions.length);

    if (transactions.length === 0) {
      // Update conversion status to failed
      if (conversionId) {
        await supabase
          .from("conversions")
          .update({
            status: "failed",
            error_message: "No transactions found in the statement",
            processing_time_ms: Date.now() - startTime,
          })
          .eq("id", conversionId);
      }
      return NextResponse.json(
        { error: "No transactions found in the statement" },
        { status: 400 }
      );
    }

    // Validate transactions and detect anomalies
    console.log("Running validation and anomaly detection...");
    const validationReport: ValidationReport = validateTransactions(transactions);
    console.log("Validation complete:", {
      duplicates: validationReport.duplicatesCount,
      anomalies: validationReport.anomaliesCount,
      balanceVerified: validationReport.balanceVerified,
    });

    // Use validated transactions (with flags) for exports
    const transactionsWithFlags = validationReport.transactions;

    // Generate CSV with all fields including Code PCG, category, merchant, and validation notes
    const csvColumns = ["date", "code_pcg", "description", "debit", "credit", "balance"];

    // Add optional columns if they exist
    if (transactions.some(t => t.category)) {
      csvColumns.push("category");
    }
    if (transactions.some(t => t.merchant)) {
      csvColumns.push("merchant");
    }
    // Always add notes column for validation flags
    csvColumns.push("notes");

    // Prepare CSV data with Code PCG and notes
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
        const rowIndex = index + 2; // +2 because Excel is 1-indexed and row 1 is header

        // Apply background color to all cells in the row
        const columns = Object.keys(excelData[0]);
        columns.forEach((col, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIndex });
          if (!worksheet[cellAddress]) return;

          if (!worksheet[cellAddress].s) {
            worksheet[cellAddress].s = {};
          }
          worksheet[cellAddress].s.fill = {
            fgColor: { rgb: transaction.rowColor.replace("#", "") },
          };
        });
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const excelBase64 = excelBuffer.toString("base64");

    // Calculate totals
    const totalDebit = transactions.reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0);
    const balanceStart = transactions.length > 0 ? parseFloat(transactions[0].balance) || null : null;
    const balanceEnd = transactions.length > 0 ? parseFloat(transactions[transactions.length - 1].balance) || null : null;

    // Update conversion record with complete data
    if (conversionId) {
      const { error: updateError } = await supabase
        .from("conversions")
        .update({
          status: "completed",
          bank_name: bankInfo.bank_name,
          account_type: bankInfo.account_type,
          currency: bankInfo.currency,
          period: bankInfo.period || null,
          transaction_count: transactions.length,
          total_debit: totalDebit,
          total_credit: totalCredit,
          balance_start: balanceStart,
          balance_end: balanceEnd,
          processing_time_ms: Date.now() - startTime,
          pages_count: pageCount,
          credits_used: !isFreeTrialRequest ? pageCount : 0,
          is_free_trial: isFreeTrialRequest,
          csv_data: csv,
          excel_data: excelBase64,
          raw_result: {
            bank_info: bankInfo,
            validation: validationReport,
          },
        })
        .eq("id", conversionId);

      if (updateError) {
        console.error("Failed to update conversion record:", updateError);
      }

      // Insert all transactions
      const transactionsToInsert = transactionsWithFlags.map((t) => ({
        conversion_id: conversionId,
        date: t.date,
        description: t.description,
        debit: parseFloat(t.debit) || null,
        credit: parseFloat(t.credit) || null,
        balance: parseFloat(t.balance) || 0,
        category: t.category || null,
        is_duplicate: t.flags?.some((f) => f.type === "duplicate") || false,
        has_anomaly: t.flags?.some((f) => f.type === "anomaly") || false,
        anomaly_type: t.flags?.find((f) => f.type === "anomaly")?.message || null,
      }));

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionsToInsert);

      if (transactionError) {
        console.error("Failed to insert transactions:", transactionError);
      }

      console.log("Conversion saved successfully:", conversionId);

      // ========================================
      // DEDUCT CREDITS (only for subscribed users, not free trial)
      // ========================================
      if (!isFreeTrialRequest) {
        try {
          console.log(`💳 Deducting ${pageCount} credit(s) for user ${user.id}`);

          // First, get current credits_used
          const { data: currentProfile } = await supabase
            .from('user_profiles')
            .select('credits_used_this_month')
            .eq('id', user.id)
            .single();

          const newCreditsUsed = (currentProfile?.credits_used_this_month || 0) + pageCount;

          // Deduct credits from user profile
          const { error: deductError } = await supabase
            .from('user_profiles')
            .update({
              credits_used_this_month: newCreditsUsed
            })
            .eq('id', user.id);

          if (deductError) {
            console.error('❌ Error deducting credits:', deductError);
            throw deductError; // Throw pour logger dans le catch
          }

          // Utiliser le service role client pour bypasser RLS
          const supabaseAdmin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          );

          // Log usage tracking avec service role
          const { error: usageError } = await supabaseAdmin
            .from('usage_tracking')
            .insert({
              user_id: user.id,
              conversion_id: conversionId,
              pages_processed: pageCount,
              credits_deducted: pageCount,
              file_name: file.name,
              file_type: file.type,
            });

          if (usageError) {
            console.error('⚠️  Error logging usage:', usageError);
          } else {
            console.log('✅ Usage tracking logged');
          }

          // Log credit transaction avec service role
          const { error: txError } = await supabaseAdmin
            .from('credit_transactions')
            .insert({
              user_id: user.id,
              transaction_type: 'deduction',
              amount: -pageCount,
              description: `Conversion: ${file.name} (${pageCount} page${pageCount > 1 ? 's' : ''})`,
              reference_id: conversionId,
            });

          if (txError) {
            console.error('⚠️  Error logging transaction:', txError);
          } else {
            console.log('✅ Credit transaction logged');
          }

          console.log(`✅ ${pageCount} credit(s) deducted successfully`);
        } catch (creditError) {
          console.error('❌ Error in credit deduction system:', creditError);
          // Ne pas bloquer le retour si erreur de déduction
          // L'utilisateur a déjà fait sa conversion, on ne peut pas la bloquer maintenant
        }
      }
    }

    return NextResponse.json({
      success: true,
      conversionId,
      bank_info: bankInfo,
      transactions,
      transactionsWithFlags,
      validation: {
        totalTransactions: validationReport.totalTransactions,
        duplicatesCount: validationReport.duplicatesCount,
        anomaliesCount: validationReport.anomaliesCount,
        totalDebit: validationReport.totalDebit,
        totalCredit: validationReport.totalCredit,
        balanceVerified: validationReport.balanceVerified,
        summary: validationReport.summary,
      },
      csv,
      excel: excelBase64,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Error type:", typeof error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    // Update conversion status to failed
    if (conversionId) {
      try {
        await supabase
          .from("conversions")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Failed to process PDF",
            processing_time_ms: Date.now() - startTime,
          })
          .eq("id", conversionId);
      } catch (updateError) {
        console.error("Failed to update conversion status:", updateError);
      }
    }

    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : "Failed to process PDF";
    const errorDetails = {
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
    };

    console.error("Returning error response:", errorDetails);

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

// Increase max file size for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
