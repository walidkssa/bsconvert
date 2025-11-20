import { NextRequest, NextResponse } from "next/server";
import {
  generateFEC,
  generateSage,
  generateCegid,
  generateQuickBooks,
  generateXero,
  validateAccountingConfig,
  type AccountingConfig,
  type Transaction,
  type ExportFormat,
} from "@/lib/accounting-formats";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions, format, config, currency } = body as {
      transactions: Transaction[];
      format: ExportFormat;
      config: AccountingConfig;
      currency?: string;
    };

    // Validation
    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions provided" },
        { status: 400 }
      );
    }

    if (!format) {
      return NextResponse.json(
        { error: "Export format not specified" },
        { status: 400 }
      );
    }

    // Pour les formats comptables, valider la configuration
    if (format === "fec" || format === "sage" || format === "cegid" || format === "quickbooks" || format === "xero") {
      if (!config) {
        return NextResponse.json(
          { error: "Accounting configuration required for this format" },
          { status: 400 }
        );
      }

      const validation = validateAccountingConfig(config);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid accounting configuration", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Générer le fichier selon le format demandé
    let fileContent: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case "fec":
        fileContent = generateFEC(transactions, config);
        filename = `FEC_${new Date().toISOString().split("T")[0]}.txt`;
        mimeType = "text/plain";
        break;

      case "sage":
        fileContent = generateSage(transactions, config);
        filename = `SAGE_${new Date().toISOString().split("T")[0]}.txt`;
        mimeType = "text/plain";
        break;

      case "cegid":
        fileContent = generateCegid(transactions, config, currency || "EUR");
        filename = `CEGID_${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
        break;

      case "quickbooks":
        fileContent = generateQuickBooks(transactions, config);
        filename = `QuickBooks_${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
        break;

      case "xero":
        fileContent = generateXero(transactions, config, currency || "EUR");
        filename = `Xero_${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }

    console.log(`Generated ${format.toUpperCase()} file with ${transactions.length} transactions`);

    return NextResponse.json({
      success: true,
      format,
      filename,
      content: fileContent,
      mimeType,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error("Error generating accounting file:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate accounting file",
      },
      { status: 500 }
    );
  }
}
