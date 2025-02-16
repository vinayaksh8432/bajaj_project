# Bajaj Project

This project consists of a client-side application built with React/Vite and a server-side application.

## Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn
-   MongoDB (for the server)

## Getting Started

Clone the repository and follow the setup instructions for both client and server.

### Server Setup

1. Navigate to the server directory:

    ```bash
    cd server
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    ```bash
    cp .env.example .env
    ```

    Then edit `.env` file with your configuration.

4. Start the server:

    ```bash
    # Development mode
    npm run dev

    # Production mode
    npm start
    ```

The server will start running on http://localhost:5000

### Client Setup

1. Navigate to the client directory:

    ```bash
    cd client
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    ```bash
    cp .env.example .env
    ```

    Then edit `.env` file with your configuration.

4. Start the development server:
    ```bash
    npm run dev
    ```

The client application will be available at http://localhost:3000

## Environment Variables

### Server

Make sure to set these variables in server/.env:

-   `PORT`: Server port (default: 5000)
-   `DB_HOST`: MongoDB host
-   `DB_PORT`: MongoDB port
-   `DB_NAME`: Database name
-   `DB_USER`: Database username
-   `DB_PASSWORD`: Database password
-   `JWT_SECRET`: Secret key for JWT
-   `ALLOWED_ORIGINS`: CORS allowed origins

### Client

Make sure to set these variables in client/.env:

-   `VITE_API_URL`: Backend API URL
-   `VITE_API_TIMEOUT`: API request timeout
-   `VITE_APP_NAME`: Application name
