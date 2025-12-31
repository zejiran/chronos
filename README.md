# Chronos

A modern, cross-platform calendar application built with Tauri, Solid.js, and Rust.

## Features

- **Cross-Platform**: Native apps for macOS, Windows, and Linux
- **Multiple Calendar Support**: Google Calendar, Microsoft Outlook, CalDAV, and local calendars
- **Beautiful Themes**: 6 built-in themes with dark/light mode support
- **Command Palette**: Quick access to all features with fuzzy search (Cmd+K)
- **Offline-First**: Full functionality without internet, syncs when connected
- **Video Call Integration**: One-click join for Zoom, Google Meet, Microsoft Teams
- **Smart Notifications**: Customizable reminders with silent hours
- **Keyboard-First**: Comprehensive keyboard shortcuts for power users
- **Privacy-Focused**: Local data storage with secure credential handling

## Tech Stack

- **Frontend**: Solid.js, TypeScript, PandaCSS
- **Backend**: Rust, Tauri v2
- **Database**: SQLite with FTS5 for search
- **Build**: Vite, GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- Rust 1.70+
- Platform-specific dependencies (see below)

### macOS

```bash
xcode-select --install
```

### Ubuntu/Debian

```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev
```

### Windows

Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with C++ support.

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chronos.git
cd chronos

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
chronos/
├── src/                    # Frontend source code
│   ├── components/         # Solid.js components
│   │   ├── Calendar/       # Calendar views
│   │   ├── CommandPalette/ # Command palette
│   │   ├── Events/         # Event management
│   │   ├── Layout/         # Layout components
│   │   ├── Settings/       # Settings UI
│   │   ├── Sidebar/        # Sidebar components
│   │   └── shared/         # Shared UI components
│   ├── lib/                # Utility functions
│   ├── stores/             # State management
│   ├── styles/             # Global CSS
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri commands
│   │   ├── db/             # Database layer
│   │   ├── models/         # Data models
│   │   ├── sync/           # Sync engine
│   │   └── utils/          # Utilities
│   └── Cargo.toml
├── styled-system/          # PandaCSS generated files
└── package.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `Cmd+N` | New event |
| `Cmd+T` | Go to today |
| `Cmd+,` | Open settings |
| `Cmd+B` | Toggle sidebar |
| `D` | Day view |
| `W` | Week view |
| `M` | Month view |
| `Y` | Year view |
| `A` | Agenda view |
| `Cmd+Left` | Previous period |
| `Cmd+Right` | Next period |

## Themes

Chronos includes 6 beautiful themes:

- **Midnight** (default dark)
- **Dawn** (light)
- **Abyss** (OLED black)
- **Arctic** (Nord-inspired)
- **Neon** (Tokyo Night)
- **Latte** (Catppuccin light)

## Calendar Providers

### Google Calendar

1. Go to Settings > Accounts
2. Click "Add Account" > Google Calendar
3. Sign in with your Google account

### Microsoft Outlook

1. Go to Settings > Accounts
2. Click "Add Account" > Microsoft Outlook
3. Sign in with your Microsoft account

### CalDAV

1. Go to Settings > Accounts
2. Click "Add Account" > CalDAV
3. Enter your CalDAV server URL and credentials

Common CalDAV URLs:
- iCloud: `https://caldav.icloud.com/`
- FastMail: `https://caldav.fastmail.com/`
- Nextcloud: `https://your-server.com/remote.php/dav/`

## Development

### Commands

```bash
# Development server
npm run tauri dev

# Build production app
npm run tauri build

# Frontend only (no Tauri)
npm run dev

# Build frontend
npm run build

# Generate PandaCSS
npx panda codegen
```

### Environment Variables

Create a `.env` file for OAuth configuration:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
VITE_MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## License

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)

- **[GPL-3.0 license](LICENSE)**
- Copyright 2025 © Juan Alegría.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
