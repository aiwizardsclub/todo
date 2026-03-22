# TODO App - Frontend

Modern TODO application built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages group
│   ├── (dashboard)/       # Dashboard pages group
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── todos/            # TODO-related components
│   ├── categories/       # Category components
│   └── tags/             # Tag components
├── lib/                  # Utility functions
│   ├── api.ts           # API client
│   ├── auth.ts          # Auth utilities
│   ├── hooks/           # Custom React hooks
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
└── middleware.ts        # Next.js middleware (auth)
```

## Features

- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ App Router for better performance
- ✅ React Query for server state management
- ✅ Form validation with Zod
- 🔜 Authentication & Authorization
- 🔜 TODO CRUD operations
- 🔜 Categories & Tags
- 🔜 Filtering & Sorting
- 🔜 Responsive design

## Deployment

This project is configured for deployment on Vercel.

```bash
# Deploy to Vercel
vercel
```

## License

MIT
