# Next.js Application with Keycloak Authentication

This project implements a secure authentication system using Next.js and Keycloak. The authentication flow is handled through OpenID Connect protocol.

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- Keycloak server (included in docker-compose)

## Setup Instructions

### 1. Keycloak Configuration

1. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Access Keycloak Admin Console:
   - URL: http://localhost:10000
   - Username: admin
   - Password: admin_password

3. Create a new Realm:
   - Click "Add realm"
   - Name: project_idea
   - Click "Create"

4. Create a new Client:
   - Go to Clients → Create client
   - Client ID: front
   - Client Protocol: openid-connect
   - Root URL: http://localhost:10001
   - Click "Save"

5. Adjust local environment:
   - Create .env.local
   - Copy .env.example and paste it in .env.local
   - Go to Clients -> front -> Credentials
   - Generate and copy Client Secret
   - Paste it in .env.local as KEYCLOAK_CLIENT_SECRET

6. Configure Client Settings:
   - Access Type: confidential
   - Valid Redirect URIs: 
     - http://localhost:10001/api/auth/callback
     - http://localhost:3000/api/auth/callback
   - Web Origins: 
     - http://localhost:10001
     - http://localhost:3000
   - Click "Save"

7. Get Client Secret:
   - Go to Credentials tab
   - Copy the Secret value

### 2. Application Configuration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env.local` file with the following content:
   ```
   KEYCLOAK_REALM=project_idea
   KEYCLOAK_CLIENT_ID=front
   KEYCLOAK_CLIENT_SECRET=your_client_secret
   KEYCLOAK_AUTH_SERVER_URL=http://localhost:10000
   ```

## Authentication Flow

1. **Initial Request**:
   - User attempts to access a protected route
   - Middleware checks for `keycloak_token` cookie
   - If no token exists, redirects to `/login`

2. **Login Process**:
   - `/login` page redirects to `/api/auth/login`
   - `/api/auth/login` constructs Keycloak authorization URL
   - User is redirected to Keycloak login page

3. **Keycloak Authentication**:
   - User enters credentials on Keycloak
   - Keycloak validates credentials
   - On success, redirects back to `/api/auth/callback` with authorization code

4. **Token Exchange**:
   - `/api/auth/callback` exchanges code for tokens
   - Access token is stored in `keycloak_token` cookie
   - User is redirected to the original requested page

5. **Protected Route Access**:
   - Middleware validates token using JWKS
   - If valid, adds user info to request headers
   - If invalid, redirects to login

## Security Features

1. **Token Validation**:
   - JWT signature verification using JWKS
   - Token expiration check
   - Issuer validation

2. **Cookie Security**:
   - HttpOnly flag to prevent XSS
   - Secure flag in production
   - SameSite policy for CSRF protection

3. **Headers**:
   - User ID: `x-user-id`
   - User Email: `x-user-email`
   - User Roles: `x-user-roles`

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the application:
   - URL: http://localhost:10001

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

1. **Infinite Redirects**:
   - Check Keycloak client configuration
   - Verify redirect URIs match exactly
   - Check token validation in middleware

2. **Token Validation Errors**:
   - Verify JWKS endpoint is accessible
   - Check token expiration
   - Validate issuer and audience claims

3. **CORS Issues**:
   - Verify Web Origins in Keycloak
   - Check redirect URIs configuration
   - Ensure proper protocol (http/https)

## API Routes

1. `/api/auth/login`:
   - Initiates Keycloak authentication
   - Redirects to Keycloak login page

2. `/api/auth/callback`:
   - Handles Keycloak callback
   - Exchanges code for tokens
   - Sets authentication cookie

3. `/api/auth/logout`:
   - Clears authentication cookie
   - Redirects to Keycloak logout

## Middleware

The middleware (`middleware.ts`) handles:
- Token validation
- User information extraction
- Protected route enforcement
- Authentication state management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
