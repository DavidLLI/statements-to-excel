# Hawk Wallet MVP

A web-based MVP for processing investment statements using Google Gemini API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file in the root directory with the following variables:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Neon Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Base URL (for local development)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Get your API keys:
   - **Clerk**: 
     - Sign up at https://clerk.com
     - Create a new application
     - Enable Email/Password authentication
     - Copy the publishable key and secret key
   - **Gemini**: 
     - Get API key from https://makersuite.google.com/app/apikey
     - Or use Google AI Studio
   - **Neon Database**:
     - Sign up at https://neon.tech
     - Create a new project
     - Copy the connection string (DATABASE_URL)
     - The database schema will be automatically created on first use

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Features

- ✅ User authentication with Clerk (email/password)
- ✅ Upload PDF/Excel/CSV investment statements
- ✅ Process files with Gemini API
- ✅ Extract standardized data into three tables:
  - Holdings
  - Transactions
  - Cash Movements
- ✅ Real-time processing status with polling
- ✅ Tabular preview of extracted data

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── upload/          # File upload endpoint
│   │   └── status/[fileId]/ # Status check endpoint
│   ├── sign-in/             # Clerk sign-in page
│   ├── sign-up/             # Clerk sign-up page
│   ├── upload/              # File upload page
│   └── status/[fileId]/     # Status and results page
├── lib/
│   ├── storage.ts           # In-memory storage (MVP)
│   ├── fileParser.ts        # PDF/Excel/CSV parsing
│   └── gemini.ts            # Gemini API integration
├── types/
│   └── index.ts             # TypeScript type definitions
└── components/
    └── Navigation.tsx       # Navigation component
```

## Data Storage

Data is stored in **Neon Postgres database**:
- `file_jobs` table: Stores all file job metadata and extracted results
- Automatic schema initialization on first use
- Optimized for Vercel serverless deployment

**Note**: The database schema is automatically created when the app first connects. You can also manually initialize it by running:
```bash
npx tsx scripts/init-db.ts
```

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Clerk (Authentication)
- Google Gemini API
- Tailwind CSS
- TypeScript
- pdf-parse (PDF parsing)
- xlsx (Excel parsing)
- papaparse (CSV parsing)

## Usage

1. Sign up or sign in
2. Navigate to the upload page
3. Select a PDF, Excel, or CSV investment statement
4. Click "Upload and Process"
5. Wait for processing (status updates automatically)
6. View extracted data in the three tabs: Holdings, Transactions, Cash Movements

## Notes

- File processing happens asynchronously
- Status page polls every 3 seconds until completion
- Supports English and Chinese statements
- Data is normalized to standardized schemas
- No database required for MVP (uses file system storage)

