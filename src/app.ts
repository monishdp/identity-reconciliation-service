import express, { json, urlencoded } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import identityRoutes from './routes/identityRoutes';
import { errorHandler } from './utils/errorHandler';
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config();

// Initialize the express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes
app.use(identityRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Identity Reconciliation Service is running'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const startServer = async () => {
  let dbInitialized = false;
  const maxRetries = 5;
  let retries = 0;
  
  while (!dbInitialized && retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} to initialize database...`);
      // Initialize the database
      await initializeDatabase();
      dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      retries++;
      console.error(`Database initialization attempt ${retries} failed:`, error);
      if (retries < maxRetries) {
        const delay = 5000; // 5 seconds
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  if (!dbInitialized) {
    console.error(`Failed to initialize database after ${maxRetries} attempts.`);
    if (process.env.NODE_ENV === 'production') {
      console.log('Starting server without database initialization...');
    } else {
      process.exit(1);
    }
  }
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();