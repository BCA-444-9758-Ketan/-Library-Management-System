const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./src/config/swagger');
const auditMiddleware = require('./src/middlewares/audit.middleware');
const errorHandler = require('./src/middlewares/error.middleware');
const { error } = require('./src/utils/responseHelper');

const authRoutes = require('./src/modules/auth/auth.routes');
const booksRoutes = require('./src/modules/books/books.routes');
const inventoryRoutes = require('./src/modules/inventory/inventory.routes');
const transactionsRoutes = require('./src/modules/transactions/transactions.routes');
const reservationsRoutes = require('./src/modules/reservations/reservations.routes');
const branchesRoutes = require('./src/modules/branches/branches.routes');
const usersRoutes = require('./src/modules/users/users.routes');
const recommendationsRoutes = require('./src/modules/recommendations/recommendations.routes');

const app = express();

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    statusCode: 429,
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    statusCode: 429,
  },
});

const issueReturnLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many circulation requests, please slow down.',
    statusCode: 429,
  },
});

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(defaultLimiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Library API is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/api/v1', auditMiddleware);

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/books', booksRoutes);
app.use('/api/v1/branches', branchesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/transactions', issueReturnLimiter, transactionsRoutes);
app.use('/api/v1/reservations', reservationsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/recommendations', recommendationsRoutes);

app.use((req, res) => {
  return error(res, {
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
});

app.use(errorHandler);

module.exports = app;
