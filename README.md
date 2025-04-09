# Personal Budget Tracker

A web application for tracking personal finances, managing expenses, income, and recurring payments.

## Features

- User authentication
- Track income and expenses
- Recurring payments automation
- Daily, weekly, monthly, and yearly views
- Persistent data storage with MongoDB

## Local Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Docker and Docker Compose (for MongoDB)

### Running Locally

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the MongoDB and app using Docker Compose:
   ```
   docker-compose up
   ```
4. Or, run separately:
   ```
   # Start MongoDB
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Start the backend server
   npm run server

   # Start the frontend in development mode
   npm run start:dev
   ```

## Deploying to Fly.io

### Prerequisites

- [Install the Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Sign up for a Fly.io account
- MongoDB Atlas account (or any MongoDB hosting)

### Deployment Steps

1. Create a MongoDB Atlas cluster or use any MongoDB hosting service
   - Configure network access to allow connections from anywhere
   - Create a database user with appropriate permissions
   - Get your MongoDB connection URI

2. Create a Fly.io app and MongoDB volume:
   ```
   fly apps create personal-budget-tracker
   fly volumes create budget_tracker_data --size 1
   ```

3. Set up your environment secrets:
   ```
   fly secrets set MONGODB_URI="your_mongodb_connection_string"
   fly secrets set JWT_SECRET="your_secure_jwt_secret"
   ```

4. Update the `REACT_APP_API_URL` in `.env.production` to point to your Fly.io app's URL:
   ```
   REACT_APP_API_URL=https://personal-budget-tracker.fly.dev
   ```

5. Deploy the application:
   ```
   fly deploy
   ```

6. Access your deployed application:
   ```
   fly open
   ```

## Project Structure

- `/public` - Static assets
- `/src` - Frontend React application code
  - `/components` - React components
  - `/context` - React context providers (Auth, etc.)
  - `/hooks` - Custom React hooks
  - `/types` - TypeScript type definitions
- `server.js` - Express backend server
- `Dockerfile` - Docker configuration for deployment
- `fly.toml` - Fly.io configuration

## Environment Variables

- `PORT` - Server port (default: 8080)
- `MONGODB_URI` - MongoDB connection URI
- `JWT_SECRET` - Secret for JWT token generation
- `NODE_ENV` - Environment mode (development/production)
- `REACT_APP_API_URL` - API URL for frontend requests

## Technologies Used

- React
- TypeScript
- date-fns for date manipulation
- CSS for styling
- Local Storage API for data persistence

## Getting Started

### Prerequisites

- Node.js and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Click on a day cell to add income or expense entries
- Click on the day balance to toggle between daily balance and running total
- Use the navigation buttons to move between months
- Switch between daily, weekly, and monthly views using the view selector

## License

MIT 