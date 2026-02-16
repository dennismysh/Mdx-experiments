# MDX Encrypted Notes

A VS Code-style encrypted note-taking application with end-to-end (E2E) encryption. Notes are encrypted client-side using AES-256-GCM before reaching the server, ensuring that only you can read your data.

## Features

- **End-to-End Encryption** — AES-256-GCM encryption with client-side master keys. The server only stores encrypted blobs and never has access to plaintext content.
- **VS Code-Inspired UI** — Activity bar, sidebar explorer, tabbed editor, title bar with dropdown menus, and status bar, all styled with the VS Code Dark+ theme.
- **CodeMirror 6 Editor** — Markdown syntax highlighting, undo/redo history, and keyboard shortcuts.
- **Live MDX Preview** — Split-pane view with real-time rendered preview alongside the editor.
- **Google OAuth Authentication** — Secure sign-in via Google with session-based auth.
- **Recovery Key System** — A 64-character hex recovery key lets you regain access to your encrypted data if you lose your session.
- **Demo Mode** — Works entirely in the browser using localStorage when no backend is available, including on GitHub Pages.
- **TEE-Ready Architecture** — Infrastructure for future Intel SGX/TDX hardware-backed encryption.

## Tech Stack

| Layer     | Technologies                                           |
|-----------|--------------------------------------------------------|
| Frontend  | React 18, Vite, CodeMirror 6, Web Crypto API          |
| Backend   | Node.js, Express, Passport.js, Google OAuth 2.0       |
| Database  | SQLite (better-sqlite3) with WAL mode                 |
| Crypto    | AES-256-GCM, PBKDF2 (600k iterations), SHA-256        |
| Security  | Helmet, HTTP-only cookies, CORS, SameSite cookies      |

## Project Structure

```
├── client/
│   ├── components/        # React UI components (App, Editor, Sidebar, etc.)
│   ├── hooks/             # useAuth, useNotes custom hooks
│   ├── utils/             # Crypto, API client, localStorage backend
│   └── styles/            # VS Code Dark+ theme CSS
├── server/
│   ├── db/                # SQLite schema and initialization
│   ├── middleware/         # Authentication middleware
│   ├── routes/            # Auth, notes, and key management endpoints
│   └── tee/               # TEE/enclave simulator
├── .github/workflows/     # GitHub Pages deployment
├── index.html             # SPA entry point
└── vite.config.js         # Vite configuration with proxy and GitHub Pages support
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm

### Installation

```bash
git clone https://github.com/dennismysh/Mdx-experiments.git
cd Mdx-experiments
npm install
```

### Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable              | Description                              |
|-----------------------|------------------------------------------|
| `GOOGLE_CLIENT_ID`   | Google OAuth 2.0 client ID               |
| `GOOGLE_CLIENT_SECRET`| Google OAuth 2.0 client secret          |
| `SESSION_SECRET`      | Random string for session signing        |
| `PORT`                | Server port (default: `4000`)            |
| `NODE_ENV`            | `development` or `production`            |
| `TEE_MODE`            | `simulation` (default) or `sgx`          |

### Running in Development

```bash
npm run dev
```

This starts both the Express server (port 4000) and the Vite dev server (port 3000) concurrently. The Vite dev server proxies API requests to the backend.

You can also run them separately:

```bash
npm run server:dev    # Express with auto-reload (nodemon)
npm run client:dev    # Vite dev server only
```

### Production Build

```bash
npm run build         # Build frontend to dist/
npm start             # Start server (serves dist/ as static files)
```

### GitHub Pages Deployment

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on pushes to `main`. To build for GitHub Pages manually:

```bash
GITHUB_PAGES=true npm run build
```

In GitHub Pages mode, the app runs entirely client-side in demo mode using localStorage for persistence.

## Encryption Architecture

```
Recovery Key (user saves)
        │
        ▼
    PBKDF2 (600k iterations, SHA-256)
        │
        ▼
  Key Encryption Key (KEK)
        │
        ▼
  AES-256-GCM encrypt/decrypt
        │
        ▼
    Master Key ──► AES-256-GCM ──► Encrypted Note (title + content)
```

- **Master Key**: A 256-bit AES key generated on first sign-up. Used to encrypt and decrypt all notes.
- **Recovery Key**: A 64-character hex string (displayed as 8 groups of 8 characters). Used to derive the KEK that wraps the master key.
- **Note Encryption**: Each note's title and content are encrypted separately, each with its own initialization vector (IV).
- **Server Storage**: The server stores only encrypted blobs and the encrypted master key. It never has access to plaintext data or the recovery key.

## API Endpoints

### Authentication

| Method | Endpoint                | Description                  |
|--------|-------------------------|------------------------------|
| POST   | `/auth/dev-login`       | Dev-only mock login          |
| GET    | `/auth/google`          | Initiate Google OAuth        |
| GET    | `/auth/google/callback` | OAuth callback               |
| GET    | `/auth/me`              | Get current user             |
| POST   | `/auth/logout`          | Destroy session              |

### Notes

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/api/notes`      | List all notes (encrypted) |
| GET    | `/api/notes/:id`  | Get a single note        |
| POST   | `/api/notes`      | Create a note            |
| PUT    | `/api/notes/:id`  | Update a note            |
| DELETE | `/api/notes/:id`  | Delete a note            |

### Key Management

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| POST   | `/api/keys/store-master-key`| Store encrypted master key         |
| GET    | `/api/keys/master-key`      | Retrieve encrypted master key      |
| POST   | `/api/keys/verify-recovery` | Verify recovery key hash           |
| POST   | `/api/keys/reset`           | Reset master key and delete notes  |

## Keyboard Shortcuts

| Shortcut         | Action             |
|------------------|--------------------|
| `Ctrl+N`         | New note           |
| `Ctrl+S`         | Save note          |
| `Ctrl+W`         | Close tab          |
| `Ctrl+B`         | Toggle sidebar     |

## Linting

```bash
npm run lint
```

## License

MIT — see [LICENSE](LICENSE) for details.
