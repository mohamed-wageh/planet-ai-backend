const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
require('express-async-errors'); // To handle async errors in controllers
require("dotenv").config();

// Import Middlewares
const errorMiddleware = require('./middlewares/error.middleware');

// Import Routes
const analyticsRoutes = require('./routes/analytics.routes');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const userRoutes = require('./routes/user.routes');
const communityRoutes = require('./routes/community.routes');
const complaintRoutes = require('./routes/complaint.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
process.env.EMAIL_USER;
process.env.EMAIL_PASS;
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
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/complaints', complaintRoutes);

app.use('/api/admin', adminRoutes);
// Unhandled Route Handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => errorMiddleware(err, req, res, next));
module.exports = app;
