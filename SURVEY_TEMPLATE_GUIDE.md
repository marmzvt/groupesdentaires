# Survey App Template Guide

A comprehensive guide to replicate this Next.js survey application with Vercel deployment, Neon PostgreSQL database, and admin dashboard.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Initial Setup](#initial-setup)
4. [Database Configuration](#database-configuration)
5. [Authentication Setup](#authentication-setup)
6. [Survey System Architecture](#survey-system-architecture)
7. [API Routes](#api-routes)
8. [Admin Dashboard](#admin-dashboard)
9. [Statistical Analysis](#statistical-analysis)
10. [Deployment on Vercel](#deployment-on-vercel)
11. [Environment Variables](#environment-variables)
12. [Customization Checklist](#customization-checklist)

---

## Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js 14** | React framework with App Router | ^14.0.0 |
| **TypeScript** | Type safety | ^5.0.0 |
| **Prisma** | ORM for database | ^5.0.0 |
| **Neon PostgreSQL** | Serverless database | - |
| **NextAuth.js** | Authentication | ^4.24.0 |
| **Tailwind CSS** | Styling | ^3.0.0 |
| **Recharts** | Charts/graphs | ^2.0.0 |
| **Framer Motion** | Animations | ^10.0.0 |

---

## Project Structure

```
survey-app/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global styles + Tailwind
│   ├── survey/
│   │   └── page.tsx               # Main survey interface
│   ├── admin/
│   │   ├── page.tsx               # Admin dashboard
│   │   ├── login/
│   │   │   └── page.tsx           # Admin login page
│   │   └── research/
│   │       └── page.tsx           # Statistical analysis page
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts       # NextAuth configuration
│       ├── responses/
│       │   └── route.ts           # CRUD for survey responses
│       ├── stats/
│       │   └── route.ts           # Descriptive statistics
│       ├── research/
│       │   └── route.ts           # Inferential statistics
│       └── export/
│           └── route.ts           # CSV export
├── components/
│   ├── survey/
│   │   ├── SurveyContainer.tsx    # Main survey logic
│   │   ├── QuestionCard.tsx       # Question display wrapper
│   │   ├── ProgressBar.tsx        # Progress indicator
│   │   └── question-types/
│   │       ├── SingleChoice.tsx   # Radio buttons
│   │       ├── MultipleChoice.tsx # Checkboxes
│   │       ├── NumericInput.tsx   # Number input
│   │       ├── TextInput.tsx      # Text/textarea
│   │       ├── ScaleQuestion.tsx  # Likert scale (0-10)
│   │       └── RankingQuestion.tsx# Drag-and-drop ranking
│   └── providers/
│       └── SessionProvider.tsx    # NextAuth session wrapper
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── auth.ts                    # NextAuth options
│   └── questions.ts               # Survey questions definition
├── prisma/
│   └── schema.prisma              # Database schema
├── public/                        # Static assets
├── .env.local                     # Local environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Initial Setup

### 1. Create Next.js Project

```bash
npx create-next-app@latest survey-app --typescript --tailwind --eslint --app --src-dir=false
cd survey-app
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install @prisma/client next-auth recharts framer-motion

# Dev dependencies
npm install -D prisma @types/node
```

### 3. Initialize Prisma

```bash
npx prisma init
```

---

## Database Configuration

### 1. Create Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (pooled connection recommended)

### 2. Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}

model Response {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  completed  Boolean  @default(false)
  data       Json     // All survey answers stored as JSON

  // Indexed fields for filtering (extract from data for performance)
  ageGroup   Int?     // Example: demographic filter
  practice   Int?     // Example: professional category
  postalCode String?  // Example: geographic filter

  @@index([completed])
  @@index([ageGroup])
  @@index([practice])
  @@index([createdAt])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}
```

### 3. Prisma Client Singleton (`lib/db.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### 4. Push Schema to Database

```bash
npx prisma db push
```

---

## Authentication Setup

### 1. Auth Configuration (`lib/auth.ts`)

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

interface AdminUser {
  id: string;
  username: string;
  password: string;
}

function getAdminUsers(): AdminUser[] {
  const users: AdminUser[] = [];

  // Primary admin
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    users.push({
      id: '1',
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    });
  }

  // Additional admins (optional)
  if (process.env.ADMIN_USERNAME_2 && process.env.ADMIN_PASSWORD_2) {
    users.push({
      id: '2',
      username: process.env.ADMIN_USERNAME_2,
      password: process.env.ADMIN_PASSWORD_2,
    });
  }

  if (process.env.ADMIN_USERNAME_3 && process.env.ADMIN_PASSWORD_3) {
    users.push({
      id: '3',
      username: process.env.ADMIN_USERNAME_3,
      password: process.env.ADMIN_PASSWORD_3,
    });
  }

  return users;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const adminUsers = getAdminUsers();
        const user = adminUsers.find(
          (u) => u.username === credentials.username && u.password === credentials.password
        );

        if (user) {
          return { id: user.id, name: user.username, email: `${user.username}@admin` };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
```

### 2. NextAuth Route (`app/api/auth/[...nextauth]/route.ts`)

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 3. Session Provider (`components/providers/SessionProvider.tsx`)

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

### 4. Root Layout (`app/layout.tsx`)

```typescript
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

---

## Survey System Architecture

### Question Types

The survey supports these question types:

| Type | Component | Data Format | Use Case |
|------|-----------|-------------|----------|
| `single` | SingleChoice | `number` or `string` | Radio buttons, one answer |
| `multiple` | MultipleChoice | `string[]` or `number[]` | Checkboxes, multiple answers |
| `numeric` | NumericInput | `number` | Number input with min/max |
| `text` | TextInput | `string` | Free text, short or long |
| `scale` | ScaleQuestion | `number` (0-10) | Likert scale slider |
| `ranking` | RankingQuestion | `string[]` | Drag-and-drop ordering |

### Question Definition (`lib/questions.ts`)

```typescript
export interface Option {
  value: string | number;
  label: string;
}

export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'numeric' | 'text' | 'scale' | 'ranking';
  section: string;
  question: string;
  subtitle?: string;
  placeholder?: string;
  options?: Option[];
  min?: number;
  max?: number;
  unit?: string;
  required: boolean;
  multiline?: boolean; // For text type
}

export const questions: Question[] = [
  // Section A: Demographics
  {
    id: 'Q1',
    type: 'single',
    section: 'A',
    question: 'What is your age group?',
    options: [
      { value: 1, label: '18-24' },
      { value: 2, label: '25-34' },
      { value: 3, label: '35-44' },
      { value: 4, label: '45-54' },
      { value: 5, label: '55+' },
    ],
    required: true,
  },
  {
    id: 'Q2',
    type: 'multiple',
    section: 'A',
    question: 'Which platforms do you use?',
    options: [
      { value: 'A', label: 'Platform A' },
      { value: 'B', label: 'Platform B' },
      { value: 'C', label: 'Platform C' },
    ],
    required: true,
  },
  {
    id: 'Q3',
    type: 'numeric',
    section: 'B',
    question: 'How many hours per week?',
    subtitle: 'Enter an approximate number',
    min: 0,
    max: 168,
    unit: 'hours',
    required: true,
  },
  {
    id: 'Q4',
    type: 'scale',
    section: 'B',
    question: 'How satisfied are you?',
    subtitle: '0 = Not at all, 10 = Extremely',
    min: 0,
    max: 10,
    required: true,
  },
  {
    id: 'Q5',
    type: 'ranking',
    section: 'C',
    question: 'Rank these factors by importance',
    options: [
      { value: 'A', label: 'Factor A' },
      { value: 'B', label: 'Factor B' },
      { value: 'C', label: 'Factor C' },
      { value: 'D', label: 'Factor D' },
    ],
    required: true,
  },
  {
    id: 'Q6',
    type: 'text',
    section: 'C',
    question: 'Any additional comments?',
    placeholder: 'Type your answer here...',
    multiline: true,
    required: false,
  },
];

// Conditional logic function
export function shouldShowQuestion(
  question: Question,
  answers: Record<string, any>
): boolean {
  // Example: Show Q3 only if Q2 includes 'A'
  if (question.id === 'Q3') {
    const q2 = answers['Q2'] as string[] | undefined;
    return q2 ? q2.includes('A') : false;
  }

  // Example: Show Q6 only if Q4 score is low
  if (question.id === 'Q6') {
    const q4 = answers['Q4'] as number | undefined;
    return q4 !== undefined && q4 < 5;
  }

  return true; // Show by default
}
```

### Survey Container Logic

Key features to implement in `SurveyContainer.tsx`:

1. **State Management**: Track current question index and all answers
2. **Navigation**: Next/Previous with validation
3. **Conditional Questions**: Filter questions based on `shouldShowQuestion()`
4. **Progress Tracking**: Calculate completion percentage
5. **Keyboard Support**: Enter to continue, arrow keys for navigation
6. **Auto-save**: Optionally save progress to localStorage
7. **Submission**: POST to `/api/responses` when complete

---

## API Routes

### 1. Responses Route (`app/api/responses/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST - Create new response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, completed } = body;

    // Extract indexed fields from data for filtering
    const ageGroup = data.Q1 as number | undefined;
    const practice = data.Q2 as number | undefined;
    const postalCode = data.Q15 as string | undefined;

    const response = await prisma.response.create({
      data: {
        data,
        completed: completed || false,
        ageGroup,
        practice,
        postalCode,
      },
    });

    return NextResponse.json({ success: true, id: response.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
  }
}

// GET - List responses (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const completed = searchParams.get('completed');

    const where = completed !== null ? { completed: completed === 'true' } : {};

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.response.count({ where }),
    ]);

    return NextResponse.json({ responses, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}

// DELETE - Remove response
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.response.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 });
  }
}
```

### 2. Stats Route (`app/api/stats/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const ageGroupFilter = searchParams.get('ageGroup');
    const practiceFilter = searchParams.get('practice');

    // Build where clause
    const where: any = { completed: true };
    if (ageGroupFilter) where.ageGroup = parseInt(ageGroupFilter);
    if (practiceFilter) where.practice = parseInt(practiceFilter);

    // Fetch responses
    const responses = await prisma.response.findMany({
      where,
      select: { data: true, createdAt: true },
    });

    // Calculate statistics for each question
    const questionStats: Record<string, any> = {};

    // Example: Calculate distribution for single choice
    const q1Counts: Record<number, number> = {};
    responses.forEach((r) => {
      const data = r.data as Record<string, any>;
      const value = data.Q1;
      if (value !== undefined) {
        q1Counts[value] = (q1Counts[value] || 0) + 1;
      }
    });

    questionStats['Q1'] = {
      title: 'Age Group',
      type: 'single',
      distribution: Object.entries(q1Counts).map(([value, count]) => ({
        value: parseInt(value),
        count,
        percentage: Math.round((count / responses.length) * 100),
      })),
    };

    // Example: Calculate average for numeric
    const numericValues = responses
      .map((r) => (r.data as any).Q3)
      .filter((v) => v !== undefined);

    if (numericValues.length > 0) {
      questionStats['Q3'] = {
        title: 'Hours per week',
        type: 'numeric',
        average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        count: numericValues.length,
      };
    }

    return NextResponse.json({
      total: await prisma.response.count(),
      totalCompleted: await prisma.response.count({ where: { completed: true } }),
      filteredCount: responses.length,
      questionStats,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
```

### 3. Export Route (`app/api/export/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { questions } from '@/lib/questions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const responses = await prisma.response.findMany({
      where: { completed: true },
      orderBy: { createdAt: 'asc' },
    });

    // Build CSV header
    const headers = ['id', 'createdAt', 'completed'];
    questions.forEach((q) => headers.push(q.id));

    // Build CSV rows
    const rows = responses.map((r) => {
      const data = r.data as Record<string, any>;
      const row: string[] = [
        r.id,
        r.createdAt.toISOString(),
        String(r.completed),
      ];

      questions.forEach((q) => {
        const value = data[q.id];
        if (value === undefined) {
          row.push('');
        } else if (Array.isArray(value)) {
          row.push(value.join('; '));
        } else {
          row.push(String(value));
        }
      });

      return row;
    });

    // Create CSV content with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
```

---

## Admin Dashboard

### Protected Admin Layout

```typescript
// app/admin/layout.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

### Dashboard Features

1. **Overview Tab**: Total responses, completion rate, daily chart
2. **Statistics Tab**: Per-question analysis with charts
3. **Response Browser**: Navigate individual responses
4. **Export**: Download CSV
5. **Filters**: Filter by demographics, date range

---

## Statistical Analysis

### Available Tests (for Research Page)

| Test | Use Case | Small Sample Adaptation |
|------|----------|------------------------|
| Chi-square | Association between categorical variables | Yates' correction |
| Fisher's exact | When expected counts < 5 | Native test |
| Welch's t-test | Compare means of two groups | Adjusted df |
| Hedges' g | Effect size | Bias correction |
| One-way ANOVA | Compare 3+ groups | Eta-squared |
| Spearman correlation | Ordinal data correlation | Adjusted t-critical |
| Paired t-test | Within-subject comparisons | df = n-1 |
| Odds Ratio | Strength of association | 95% CI |
| Bonferroni correction | Multiple testing | Adjusted threshold |

### Implementation Notes

- For small samples (n < 50), use Fisher's exact test instead of Chi-square
- Always report effect sizes alongside p-values
- Include warnings when sample sizes are very small
- Use Hedges' g instead of Cohen's d for small samples

---

## Deployment on Vercel

### 1. Connect Repository

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Select Next.js framework preset

### 2. Configure Build Settings

- **Framework**: Next.js
- **Build Command**: `npm run build` (or `prisma generate && next build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Add Environment Variables

In Vercel project settings > Environment Variables, add all variables from `.env.local`

### 4. Database Connection

Neon provides connection pooling. Use the pooled connection string for `DATABASE_URL`.

### 5. Deploy

Vercel auto-deploys on push to main branch.

---

## Environment Variables

### Required Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Admin credentials (primary)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure-password-here"
```

### Optional Variables

```env
# Additional admin users
ADMIN_USERNAME_2="admin2"
ADMIN_PASSWORD_2="password2"
ADMIN_USERNAME_3="admin3"
ADMIN_PASSWORD_3="password3"

# Direct database URL (for migrations)
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"
```

### Generate NextAuth Secret

```bash
openssl rand -base64 32
```

---

## Customization Checklist

When creating a new survey, customize these files:

### 1. Questions (`lib/questions.ts`)
- [ ] Define all questions with proper types
- [ ] Set up sections/categories
- [ ] Configure conditional logic in `shouldShowQuestion()`
- [ ] Set required/optional flags

### 2. Database Schema (`prisma/schema.prisma`)
- [ ] Add indexed fields for your filters
- [ ] Update Response model if needed

### 3. Statistics (`app/api/stats/route.ts`)
- [ ] Configure `questionsToAnalyze` array
- [ ] Set up label mappings for options
- [ ] Add custom aggregations

### 4. Research Analysis (`app/api/research/route.ts`)
- [ ] Define research questions
- [ ] Implement appropriate statistical tests
- [ ] Configure variable mappings

### 5. Admin Dashboard (`app/admin/page.tsx`)
- [ ] Update `valueLabels` for response browser
- [ ] Update `questionTitles` mapping
- [ ] Configure chart colors
- [ ] Set up filter options

### 6. Export (`app/api/export/route.ts`)
- [ ] Verify all questions are exported
- [ ] Add any computed columns

### 7. Styling
- [ ] Update `tailwind.config.ts` for brand colors
- [ ] Customize `globals.css`
- [ ] Update landing page content

### 8. Metadata
- [ ] Update `app/layout.tsx` metadata
- [ ] Add favicon and images to `public/`

---

## Common Issues & Solutions

### Issue: Cached API responses on Vercel
**Solution**: Add to each API route:
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### Issue: Data type mismatches (number vs string)
**Solution**: Create helper functions for type-safe comparisons:
```typescript
const isYes = (v: any) => v === 1 || v === '1' || v === true;
const isNo = (v: any) => v === 0 || v === '0' || v === false;
```

### Issue: CSV encoding for Excel
**Solution**: Add UTF-8 BOM at start of CSV:
```typescript
const BOM = '\uFEFF';
const csv = BOM + content;
```

### Issue: Mobile display for ranking questions
**Solution**: Add max-height and overflow:
```css
.ranking-container {
  max-height: 55vh;
  overflow-y: auto;
}
```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Recharts Documentation](https://recharts.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

*Last updated: January 2026*
