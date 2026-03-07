const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
require('express-async-errors'); // To handle async errors in controllers

// Import Middlewares
const errorMiddleware = require('./middlewares/error.middleware');

// Import Routes
const authRoutes = require('./routes/auth.routes');

const app = express();

// Global Middlewares
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Allow cross-origin requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Logger
}

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is up and running' });
});

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRoutes);

// Unhandled Route Handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
