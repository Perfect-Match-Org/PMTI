# Perfect Match Type Indicator

Welcome to the Cornell Perfect Match Type Indicator repository!

This repository contains the code for the Perfect Match Website, built using Next.js and pnpm.

## Getting Started

To get started, run the following command

```bash
pnpm i
pnpm dev
```

## Code Architecture

**Next.js 15 App Router Structure**:
- Uses App Router with TypeScript
- Server-side authentication with NextAuth.js
- MongoDB with Mongoose (connection ready, models not yet implemented)
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS v4 with CSS variables for theming

**Path Aliases** (configured in tsconfig.json):
```
@/*           → ./src/*
@components/* → ./src/components/*
@ui/*         → ./src/components/ui/*
@lib/*        → ./src/lib/*
@db/*         → ./src/db/*
@utils/*      → ./src/lib/utils/*
```

**Key Directories**:
- `src/app/` - Next.js App Router pages and API routes
- `src/components/ui/` - shadcn/ui component library
- `src/lib/` - Utility functions
- `src/db/` - Database models and controllers

## Contributing

We welcome contributions to the Cornell Perfect Match repository. If you would like to contribute, please fork the
repository and create a pull request.

## Contact

If you have any questions or concerns, please email us at
[perfectmatch@cornell.edu](mailto:perfectmatch@cornell.edu).

Thank you for your interest in Cornell Perfect Match and we hope that you enjoy using our application!