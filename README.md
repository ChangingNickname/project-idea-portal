# Project Idea HeroUI

A modern web application built with Next.js and HeroUI, featuring user authentication and profile management.

## Features

### Authentication
- Email/Password authentication
- Google OAuth integration
- Anonymous authentication
- Session management with secure cookies
- Protected API routes

### User Profiles
- Personal profile page (`/profile/me`)
- Public profile pages (`/profile/[id]`)
- User avatar with fallback to initials
- Comprehensive user information display:
  - Basic information (name, email, phone)
  - Authentication methods
  - Multi-factor authentication status
  - Account metadata
  - Account status

### API Endpoints
- `/api/auth/session` - Session management
- `/api/user/me` - Current user profile
- `/api/user/[id]` - User profile by ID

### Components
- `UserAvatar` - Reusable avatar component with fallback
- `LoginForm` - Authentication form with multiple providers
- Profile pages with responsive design

## Tech Stack
- Next.js 14
- HeroUI
- Firebase Authentication
- TypeScript
- Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your Firebase credentials
4. Run the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables
Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_ADMIN_CLIENT_EMAIL`

## Project Structure
```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── session/
│   │   └── user/
│   │       ├── [id]/
│   │       └── me/
│   └── profile/
│       ├── [id]/
│       └── me/
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   └── user/
│       └── UserAvatar.tsx
├── lib/
│   └── firebase/
│       └── admin.ts
├── types/
│   └── firebase-admin.d.ts
└── utils/
    ├── client/
    │   └── user.ts
    └── server/
        └── user.ts
```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## MDX Editor Implementation

The project includes a rich text editor based on MDX Editor with the following features:

### Features
- Rich text editing with markdown support
- Source code view
- Diff mode for comparing versions
- Undo/Redo functionality
- Basic markdown formatting (headings, lists, quotes)

### Components
1. `InitializedMDXEditor` - Base editor component with plugins
2. `ForwardRefEditor` - Client-side only wrapper with dynamic import
3. Test page at `/editor/test` for demonstration

### Usage
```tsx
import { ForwardRefEditor } from '@/components/editor/ForwardRefEditor'

export default function MyEditor() {
  return (
    <ForwardRefEditor
      markdown="# Your content here"
      onChange={(markdown) => console.log(markdown)}
    />
  )
}
```

### Available Plugins
- Headings
- Lists
- Quotes
- Thematic breaks
- Markdown shortcuts
- Diff/Source mode
- Toolbar with Undo/Redo
