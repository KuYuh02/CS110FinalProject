# SnapShare - Photo Sharing App

## Project Structure
- `Client/` - React frontend application
- `Server/` - Node.js backend server

## Setup Instructions

### Backend Setup
1. Navigate to the Server directory:
   ```bash
   cd Server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   The server will run on port 3000.

### Frontend Setup
1. Navigate to the Client/Client directory:
   ```bash
   cd Client/Client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Testing the Signup Functionality

1. Make sure both the backend server and frontend are running
2. Open your browser and navigate to the signup page
3. Fill out the signup form with:
   - Username (at least 3 characters)
   - Email (valid email format)
   - Password (at least 6 characters)
4. Submit the form
5. Check the browser console and server console for debugging information
6. After successful registration, you should be redirected to the home page
7. Try logging in with the same credentials

## Debugging

The application now includes comprehensive logging to help debug any issues:

- **Client-side**: Check browser console for API request/response logs
- **Server-side**: Check server console for registration attempt logs and file operation logs

## Fixed Issues

- Signup form now properly connects to the backend API
- Added comprehensive error handling and validation
- Added detailed logging for debugging
- Fixed file writing issues with proper error checking
- Added input validation (username length, password length, required fields)

## File Structure

- `Server/auth.js` - Authentication logic (register, login)
- `Server/utils.js` - File I/O operations
- `Server/index.js` - Express server setup
- `Client/Client/src/pages/Signup.jsx` - Signup form component
- `Client/Client/src/services/api.js` - API service functions
- `Client/Client/src/context/AuthContext.jsx` - Authentication context
