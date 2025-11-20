# BS Convert - Bank Statement Converter

Convert your bank statements from PDF to CSV/Excel/FEC instantly using AI-powered extraction with automatic bank format detection and French accounting software integration.

## Features

### 🎯 Core Features
- **Multi-Format Upload**: Supports PDF, JPG, and PNG files with drag & drop
- **Multi-Language Support**: Works with bank statements in ANY language (English, French, Spanish, German, Arabic, Chinese, Japanese, etc.)
- **Automatic Bank Detection**: Intelligently detects bank format worldwide
- **AI-Only Processing**: Uses Grok 4 Fast Reasoning for all processing (no traditional OCR)
- **Multi-Account Support**: Handles checking accounts, credit cards, savings accounts, and business accounts
- **Smart Categorization**: Auto-categorizes transactions (food, transport, shopping, salary, utilities, etc.)
- **Multi-Format Export**: CSV, Excel, FEC, Sage, Cegid with configurable options
- **French Accounting Integration**: FEC, Sage 100c, and Cegid Loop formats for seamless import
- **Modern UI**: Built with Next.js 15, React 19, and ShadcN/UI
- **Vercel Ready**: Optimized for deployment on Vercel

### 🇫🇷 French Accounting Features
- **FEC (Fichier des Écritures Comptables)**: Universal legal format compatible with ALL French accounting software
- **Sage 100c**: Direct import format with customizable mapping
- **Cegid Loop**: JSON format for API integration with attachment support
- **Automatic Account Mapping**: Smart categorization based on French Chart of Accounts (Plan Comptable Général)
- **Configurable Journal Codes**: Customize journal codes, account numbers, and auxiliary accounts

### 🏦 Supported Banks

**French Banks:**
- BNP Paribas
- Crédit Agricole
- Société Générale
- LCL
- Banque Postale
- Caisse d'Épargne
- Boursorama
- Crédit Mutuel
- CIC

**Neobanks:**
- Revolut
- N26
- Qonto
- Wise
- Lydia

**International:**
- UK: HSBC, Barclays, Lloyds, NatWest, Monzo, Starling
- USA: Bank of America, Chase, Wells Fargo, Citibank, Capital One
- Germany: Deutsche Bank, Commerzbank, Sparkasse, Volksbank
- Spain: Santander, BBVA, CaixaBank
- Switzerland: UBS, Credit Suisse
- Middle East: Emirates NBD, Qatar National Bank, Al Rajhi Bank
- Asia: DBS, OCBC, ICBC, Bank of China
- **And ANY other bank worldwide**

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadcN/UI
- **PDF Extraction**: pdf-extraction (fast text extraction)
- **AI Processing**: XAI Grok 4 Fast Reasoning (text & vision analysis)
- **Export**: PapaParse (CSV) + SheetJS (Excel)
- **Accounting Formats**: Custom FEC, Sage, and Cegid generators

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- XAI API key

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your XAI API key:

```
XAI_API_KEY=your_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload**: Drag & drop or click to upload a bank statement (PDF, JPG, or PNG)
2. **Convert**: Click "Convert Now" and wait for AI to extract transactions
3. **Choose Format**: Select your export format:
   - CSV/Excel for standard use
   - FEC for universal French accounting compatibility
   - Sage for optimized Sage 100c import
   - Cegid for Cegid Loop API integration
4. **Configure** (if accounting format): Set your journal code, account numbers, etc.
5. **Download**: Get your file ready for import

## How It Works

1. **File Upload**: User uploads a bank statement (PDF, JPG, or PNG)
2. **Smart Extraction**:
   - PDFs: Fast text extraction using pdf-extraction library
   - Images: Advanced OCR with Tesseract.js (10+ languages supported)
3. **Language Detection**: Automatically detects document language
4. **Bank Detection**: Grok 4 AI automatically detects the bank, country, and account type
5. **Intelligent Analysis**: AI adapts extraction to the detected format and language
6. **Auto-Categorization**: Each transaction is automatically categorized
7. **Merchant Normalization**: Cleans up merchant names (e.g., "AMZN MKT" → "Amazon")
8. **Data Export**: Enriched data with bank info, categories, and clean merchant names
9. **Download**: Get CSV or Excel with all extracted information

## Extracted Data Structure

Each conversion provides:
- **Bank Information**: Detected bank name, account type, currency, period
- **Transaction Details**: Date, description, debit, credit, balance
- **Smart Categorization**: Auto-detected category for each transaction
- **Clean Merchant Names**: Normalized merchant/vendor names

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your `XAI_API_KEY` environment variable
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Environment Variables

- `XAI_API_KEY`: Your XAI API key for Grok AI

## Future Enhancements

- User authentication with Supabase
- Transaction history storage
- Support for multiple bank formats
- Batch processing
- Custom export templates

## License

MIT
