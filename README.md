# Fintracker

A comprehensive Personal Finance Assistant built with Next.js, tRPC, and shadcn/ui components.

## Features Implemented

### Core Features

- **Dashboard with Financial Overview**
  - Stats cards showing total balance, monthly income/expenses, transaction count
  - Recent transactions list
  - Interactive charts showing income vs expenses
  - Quick action buttons

- **Transaction Management**
  - Complete transaction list with filtering and search
  - Filter by type (income/expense), category, date range
  - Add new transactions with a comprehensive form
  - Edit and delete existing transactions

- **Analytics & Visualizations**
  - Income vs Expenses bar chart
  - Expenses by category pie chart
  - Balance trend over time
  - Customizable date ranges

- **Receipt Upload**
  - Drag and drop file upload
  - Support for images (JPG, PNG) and PDF files
  - Simulated AI-powered data extraction
  - Progress tracking and error handling

- **Reports**
  - Monthly summary reports
  - Category breakdown analysis
  - Detailed transaction reports
  - Trend analysis
  - Export functionality (CSV/PDF)

### 🎨 UI/UX Features

- **Modern Design**
  - Clean, responsive layout using shadcn/ui components
  - Tangerine color theme
  - Dark/light mode support
  - Mobile-friendly design

- **Navigation**
  - Collapsible sidebar navigation
  - User profile dropdown
  - Breadcrumb navigation

- **Interactive Elements**
  - Loading states and skeleton screens
  - Toast notifications for user feedback
  - Modal dialogs for forms
  - Progress indicators

### 🔐 Authentication

- **Google OAuth Integration**
  - Secure sign-in with Google
  - Session management with JWT
  - User profile display
  - Automatic user creation/update

### 📱 Responsive Design

- Mobile-first approach
- Optimized for tablets and desktop
- Collapsible sidebar for mobile
- Responsive grid layouts

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS 4 with shadcn/ui components
- **Authentication:** NextAuth.js with Google OAuth
- **State Management:** tRPC for API calls
- **Database:** PostgreSQL with Prisma ORM
- **AI/ML:** Google Gemini AI for receipt processing
- **Forms:** React Hook Form with Zod validation
- **Charts:** Recharts for data visualization
- **Icons:** Lucide React
- **Notifications:** Sonner for toast messages

## Architecture Overview

```mermaid
graph TB
    %% User Layer
    User[👤 User]

    %% Frontend Layer
    subgraph "Frontend - Next.js 15"
        UI[🎨 UI Components<br/>shadcn/ui + Tailwind]
        Pages[📱 Pages<br/>Dashboard, Transactions<br/>Analytics, Receipt Upload<br/>Reports]
        Layout[🏗️ Layout<br/>Sidebar Navigation<br/>Theme Provider<br/>Session Provider]
    end

    %% Authentication Layer
    subgraph "Authentication"
        Auth[🔐 NextAuth.js<br/>Google OAuth]
        Session[📝 JWT Sessions]
    end

    %% API Layer
    subgraph "API Layer"
        tRPC[⚡ tRPC Router<br/>Type-safe API]
        REST[🌐 REST Endpoints<br/>/api/process-receipt]
        TransactionRouter[📊 Transaction Router<br/>CRUD Operations<br/>getSummary]
    end

    %% External Services
    subgraph "External Services"
        Google[🤖 Google OAuth<br/>Authentication]
        Gemini[🧠 Google Gemini AI<br/>Receipt Processing<br/>OCR & Data Extraction]
    end

    %% Database Layer
    subgraph "Database - PostgreSQL"
        Prisma[🗄️ Prisma ORM<br/>Type-safe Database Client]
        UserModel[👥 User Model<br/>id, name, email, image]
        TransactionModel[💰 Transaction Model<br/>id, type, category<br/>amount, description<br/>date, userId]
    end

    %% File Processing
    subgraph "File Processing"
        FileUpload[📁 File Upload<br/>Images, PDFs]
        TextExtraction[📄 Text Extraction<br/>PDF Parse<br/>Vision API]
    end

    %% Component Libraries
    subgraph "UI Libraries"
        Radix[⚛️ Radix UI<br/>Primitives]
        Charts[📊 Recharts<br/>Data Visualization]
        Forms[📝 React Hook Form<br/>+ Zod Validation]
    end

    %% Data Flow
    User --> UI
    UI --> Pages
    Pages --> Layout
    Layout --> Auth
    Auth --> Google
    Auth --> Session

    Pages --> tRPC
    Pages --> REST
    tRPC --> TransactionRouter
    REST --> Gemini
    REST --> FileUpload
    FileUpload --> TextExtraction
    TextExtraction --> Gemini

    TransactionRouter --> Prisma
    Prisma --> UserModel
    Prisma --> TransactionModel

    UI --> Radix
    UI --> Charts
    UI --> Forms

    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef auth fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef api fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef database fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef processing fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    classDef ui fill:#e3f2fd,stroke:#1565c0,stroke-width:2px

    class UI,Pages,Layout frontend
    class Auth,Session,Google auth
    class tRPC,REST,TransactionRouter api
    class Prisma,UserModel,TransactionModel database
    class Gemini external
    class FileUpload,TextExtraction processing
    class Radix,Charts,Forms ui
```

## Pages Structure

```
/                     - Dashboard with overview
/transactions         - Transaction list and management
/analytics           - Charts and data visualization
/receipt-upload      - File upload for receipt processing
/reports             - Financial reports and exports
```

## Components Architecture

```
src/components/
├── ui/                    # shadcn/ui base components
├── layout/
│   ├── app-sidebar.tsx   # Navigation sidebar
│   └── dashboard-layout.tsx # Main layout wrapper
├── dashboard/
│   ├── stats-card.tsx    # Statistics display cards
│   ├── recent-transactions.tsx # Transaction list widget
│   └── overview-chart.tsx # Dashboard charts
└── transactions/
    └── add-transaction-dialog.tsx # Transaction form modal
```

## Key Features Details

### Transaction Form

- Type selection (income/expense)
- Dynamic category selection based on type
- Amount input with validation
- Date picker with calendar
- Optional description field
- Form validation with error messages

### Filtering System

- Search across description and category
- Filter by transaction type
- Category-based filtering
- Date range selection with calendar
- Clear all filters functionality

### Charts & Analytics

- Interactive bar charts for income vs expenses
- Pie charts for category breakdown
- Area charts for balance trends
- Responsive chart containers
- Custom color schemes

### Receipt Upload

- Drag and drop interface
- File type validation (images, PDFs)
- File size limits (10MB)
- Upload progress tracking
- Simulated AI data extraction
- Error handling and retry functionality

## Development Features

- **Type Safety:** Full TypeScript support
- **Code Quality:** ESLint and Prettier configured
- **Performance:** Optimized bundle with Next.js
- **SEO:** Server-side rendering support
- **Accessibility:** ARIA labels and keyboard navigation

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher) - [Download from nodejs.org](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Docker** or **Podman** for the database - [Docker Desktop](https://docs.docker.com/desktop/) | [Podman](https://podman.io/getting-started/installation)
- **Git** for version control

### Required API Keys & Services

You'll need to set up the following services:

1. **Google Cloud Console** (for OAuth and Gemini AI):
   - Create a project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google OAuth 2.0 API
   - Enable Gemini AI API
   - Create credentials (OAuth 2.0 Client ID and API Key)

2. **PostgreSQL Database** (handled via Docker script)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd finance_tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env  # if you have an example file
   # or create .env manually
   ```

   Add the following environment variables to your `.env` file:

   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_tracker"

   # NextAuth.js
   AUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"

   # Google OAuth
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"

   # Google Gemini AI
   GEMINI_API_KEY="your-gemini-api-key"

   # Node Environment(optional, if not set, it will be set to development)
   NODE_ENV="development"
   ```

4. **Start the database**

   The project includes a convenient script to set up a PostgreSQL database using Docker:

   ```bash
   chmod +x start-database.sh
   ./start-database.sh
   ```

   This script will:
   - Create and start a PostgreSQL container
   - Use the database URL from your `.env` file
   - Optionally generate a secure password if you're using the default

5. **Set up the database schema**

   ```bash
   npm run db:push
   # or if you want to use migrations
   npm run db:generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables Details

| Variable             | Description                  | Required | Example                                                         |
| -------------------- | ---------------------------- | -------- | --------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string | ✅       | `postgresql://postgres:password@localhost:5432/finance_tracker` |
| `AUTH_SECRET`        | Secret key for NextAuth.js   | ✅       | Generate with `openssl rand -base64 32`                         |
| `AUTH_GOOGLE_ID`     | Google OAuth Client ID       | ✅       | From Google Cloud Console                                       |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret   | ✅       | From Google Cloud Console                                       |
| `GEMINI_API_KEY`     | Google Gemini AI API Key     | ✅       | From Google Cloud Console                                       |
| `NODE_ENV`           | Environment mode             | ✅       | `development`, `production`, or `test`                          |

### Database Commands

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `npm run db:push`     | Push schema changes to database   |
| `npm run db:generate` | Generate and run migrations       |
| `npm run db:studio`   | Open Prisma Studio (database GUI) |
| `npm run db:migrate`  | Deploy migrations to production   |

### Development Commands

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start development server with Turbo  |
| `npm run build`        | Build the application for production |
| `npm run start`        | Start production server              |
| `npm run lint`         | Run ESLint                           |
| `npm run lint:fix`     | Fix ESLint errors automatically      |
| `npm run typecheck`    | Run TypeScript type checking         |
| `npm run format:check` | Check code formatting                |
| `npm run format:write` | Format code with Prettier            |

### Google Cloud Setup Guide

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Enable "Google+ API" for OAuth
   - Enable "Generative Language API" for Gemini

3. **Create OAuth 2.0 Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`

4. **Get Gemini API Key**
   - Go to "Credentials" → "Create Credentials" → "API key"
   - Restrict the key to "Generative Language API" for security

### Troubleshooting

**Database Connection Issues:**

- Ensure Docker is running: `docker ps`
- Check if the database container is running: `docker ps | grep postgres`
- Restart the database: `./start-database.sh`

**Authentication Issues:**

- Verify Google OAuth credentials are correct
- Check redirect URIs match your domain
- Ensure `AUTH_SECRET` is set and secure

**AI Processing Issues:**

- Verify `GEMINI_API_KEY` is valid
- Check API quotas in Google Cloud Console
- Ensure the Generative Language API is enabled

**Build Issues:**

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be v18+)

The application provides a solid foundation for a comprehensive personal finance management system with modern UI/UX best practices.
