8# Livrya Writer's Studio

A modern React-based writing studio for creating and managing book narrations with AI-powered tools.

## 🚀 Features

- **Modern Tech Stack**: React 19 + Vite 6 + TypeScript 5.7
- **State Management**: Zustand for lightweight, efficient state management
- **Styling**: Tailwind CSS 4 with custom dark theme
- **Data Fetching**: TanStack Query v5 for server state management
- **Authentication**: OAuth 2.0 + PKCE for secure SSO integration
- **Real-time Updates**: Socket.io for live narration progress
- **3-Zone Layout**: Efficient workspace with sidebar, canvas, and panels

## 📦 Project Structure

```
src/
├── app/              # Application setup and routing
├── auth/             # Authentication components and logic
├── features/         # Feature-based modules
│   ├── book-selector/    # Book selection interface
│   └── studio/           # Main writer studio
│       ├── components/   # Studio UI components
│       └── hooks/        # Custom React hooks
├── shared/           # Shared resources
│   ├── api/              # HTTP client and endpoints
│   ├── components/       # Reusable components
│   ├── hooks/            # Shared hooks
│   ├── lib/              # Utilities and helpers
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript type definitions
└── styles/           # Global styles
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# SSO Configuration
VITE_SSO_URL=http://localhost:4200/auth/sso/authorize
VITE_SSO_CLIENT_ID=livrya-writer-studio
VITE_SSO_REDIRECT_URI=http://localhost:5173/auth/callback

# Application URLs
VITE_APP_URL=http://localhost:4200
VITE_WRITER_URL=http://localhost:5173
```

## 🏗️ Architecture

### State Management

The application uses Zustand for state management with three main stores:

- **Auth Store**: User authentication and session management
- **Studio Store**: Active book/chapter and editing state
- **UI Store**: UI preferences and panel states

### API Integration

- **HTTP Client**: Axios with automatic token refresh
- **WebSocket**: Socket.io for real-time updates
- **Data Fetching**: TanStack Query for caching and synchronization

### Authentication Flow

1. User accesses protected route
2. AuthGuard checks authentication status
3. If not authenticated, redirects to SSO with PKCE
4. After SSO success, exchanges code for tokens
5. Stores tokens and user info in Zustand store
6. Redirects back to original route

## 📚 Key Components

### Writer Studio Layout

- **TopBar**: Navigation, save status, and focus mode toggle
- **LeftSidebar**: Chapter tree, character list, and statistics
- **Canvas**: Main writing area with speech blocks
- **RightPanel**: AI chat, media tools, and properties
- **StatusBar**: Word count and narration stats

## 🎨 Styling

The application uses Tailwind CSS 4 with a custom dark theme optimized for long writing sessions:

- Dark background colors (zinc-950, zinc-900)
- Accent color: Amber (#f59e0b)
- Focus on readability and eye comfort
- Responsive design for various screen sizes

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e
```

## 📖 Documentation

For detailed documentation, see:

- [Architecture Document](docs/LivryaWriterStudioReact.md)
- [UX Concept](docs/Livrya Conceito Ux.md)
- [Prototype](docs/protótipo.jsx)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linter
4. Submit a pull request

## 📄 License

Private - All rights reserved

## 🔗 Related Projects

- **Livrya App** (Angular): Main social network and reader app
- **Backend API** (NestJS): REST API and WebSocket server
- **AI Service**: Text-to-speech and AI tools

## 📞 Support

For questions or issues, contact the development team.
