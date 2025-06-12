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
  try {
    // Initialize the database
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();