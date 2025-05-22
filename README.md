# Next.js Application with Firebase Authentication

This project implements a secure authentication system using Next.js and Firebase Authentication. The authentication flow supports multiple providers including email/password, Google, and anonymous sign-in.

## Prerequisites

- Node.js 18 or higher
- Firebase account
- Git

## Firebase Setup

1. Create a Firebase Project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter a project name (e.g., "project-idea")
   - Follow the setup wizard

2. Enable Authentication:
   - In Firebase Console, go to "Authentication" → "Sign-in method"
   - Enable the following providers:
     - Email/Password
     - Google
     - Anonymous

3. Configure Google Sign-in:
   - In the Google provider settings
   - Add your authorized domains
   - Configure OAuth consent screen if needed

4. Get Firebase Configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Register your app with a nickname
   - Copy the Firebase configuration object

5. Set up Environment Variables:
   Create a `.env.local` file with the following content:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Database Management with Prisma

### Initial Setup

1. Initialize Prisma in your project:
   ```bash
   npx prisma init
   ```
   This creates a `prisma` directory with a `schema.prisma` file and a `.env` file.

2. Configure your database connection in `.env`:
   ```
   DATABASE_URL="postgresql://project_idea:project_idea@localhost:10002/project_idea"
   ```

### Schema Management

1. Create or modify your database schema in `prisma/schema.prisma`:
   ```prisma
   model User {
     id        Int      @id @default(autoincrement())
     email     String   @unique
     name      String?
     createdAt DateTime @default(now())
   }
   ```

2. Create a migration after schema changes:
   ```bash
   npx prisma migrate dev --name init
   ```

## Authentication Flow

1. **Initial Request**:
   - User attempts to access a protected route
   - Middleware checks for Firebase authentication state
   - If not authenticated, redirects to `/login`

2. **Login Process**:
   - User can choose between:
     - Email/Password login
     - Google Sign-in
     - Anonymous Sign-in
   - Firebase handles the authentication process

3. **Authentication State**:
   - Firebase maintains the authentication state
   - User information is stored in localStorage
   - Protected routes check for valid authentication

4. **Protected Route Access**:
   - Middleware validates Firebase token
   - If valid, allows access to protected routes
   - If invalid, redirects to login

## Security Features

1. **Token Validation**:
   - Firebase JWT verification
   - Token expiration check
   - Secure session management

2. **User Information**:
   - Email verification
   - Profile information
   - Authentication state persistence

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application:
   - URL: http://localhost:3000

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Troubleshooting

1. **Authentication Issues**:
   - Check Firebase configuration
   - Verify environment variables
   - Check browser console for errors

2. **Token Validation Errors**:
   - Verify Firebase project settings
   - Check token expiration
   - Validate Firebase configuration

3. **CORS Issues**:
   - Verify authorized domains in Firebase Console
   - Check Firebase configuration
   - Ensure proper protocol (http/https)

## API Routes

1. `/api/auth/login`:
   - Handles Firebase authentication
   - Manages user session

2. `/api/auth/logout`:
   - Handles user logout
   - Clears authentication state

## Middleware

The middleware (`middleware.ts`) handles:
- Firebase token validation
- User information extraction
- Protected route enforcement
- Authentication state management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
