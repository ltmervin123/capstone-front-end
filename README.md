# Readme

To preview markdown file press "ctrl + shft + v" on the keyboard


# Setup Guide

This guide provides instructions for setting up and running the Capstone Front-End application.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Node.js

- **Required Version**: Node.js 18.x or higher (recommended: 20.x LTS)
- **Download**: [https://nodejs.org/](https://nodejs.org/)
- **Verify Installation**:
  ```bash
  node --version
  ```
  Should output `v18.x.x` or higher

### pnpm

- **Required Version**: pnpm 8.x or higher
- **Install pnpm** (after Node.js is installed):
  ```bash
  npm install -g pnpm
  ```
- **Verify Installation**:
  ```bash
  pnpm --version
  ```
  Should output `8.x.x` or higher

## Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd capstone-front-end
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```
   This will install all required packages listed in `package.json`

## Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
pnpm dev
```

- The application will be available at `http://localhost:5173` (or another port if 5173 is in use)
- Changes to the code will automatically reload in the browser
- Press `Ctrl+C` to stop the development server

### Production Build

Build the application for production:

```bash
pnpm build
```

This command:

- Compiles TypeScript (`tsc -b`)
- Bundles the application with Vite
- Outputs optimized files to the `dist/` directory

### Preview Production Build

Preview the production build locally:

```bash
pnpm preview
```

- Serves the built application from the `dist/` directory
- Useful for testing the production build before deployment

### Linting

Check code quality and style:

```bash
pnpm lint
```

## Tech Stack

This application uses:

- **React 19** - UI framework
- **TypeScript 6** - Type-safe JavaScript
- **Vite 8** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **TanStack Query** - Data fetching and state management
- **Zustand** - Lightweight state management
- **Zod** - Schema validation

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.)

### pnpm Command Not Found

Make sure pnpm is installed globally:

```bash
npm install -g pnpm
```

### Module Not Found Errors

Delete `node_modules` and reinstall:

```bash
rm -rf node_modules
pnpm install
```

### TypeScript Errors

Ensure you're using the correct TypeScript version:

```bash
pnpm list typescript
```

## Project Structure

```
capstone-front-end/
├── public/          # Static assets
├── src/             # Source code
│   ├── assets/      # Images, fonts, etc.
│   ├── features/    # Feature-based modules
│   │   ├── auth/    # Authentication feature
│   │   ├── dashboard/  # Dashboard feature
│   │   └── ...      # Other features
│   ├── components/  # Shared/common components
│   ├── hooks/       # Custom React hooks
│   ├── utils/       # Utility functions
│   ├── types/       # TypeScript type definitions
│   ├── services/    # API services and data fetching
│   ├── stores/      # Zustand state stores
│   ├── App.tsx      # Main application component
│   ├── main.tsx     # Application entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── package.json     # Dependencies and scripts
├── vite.config.ts   # Vite configuration
└── tsconfig.json    # TypeScript configuration
└── .env.example     # Environment variables use with the app
```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [pnpm Documentation](https://pnpm.io/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
