const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { z } = require('zod');

// ---- Validation Schemas ----

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  role: z.enum(['STUDENT', 'LIBRARIAN', 'ADMIN']).optional().default('STUDENT'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Service Functions ----

const SALT_ROUNDS = 12; // Industry standard: 10-12 rounds

/**
 * Register a new user.
 * Hashes password with bcrypt (12 rounds - don't go lower than 10 in production).
 */
const register = async (data) => {
  const validated = registerSchema.parse(data);

  if (validated.role && validated.role !== 'STUDENT') {
    const err = new Error('Public registration is only allowed for STUDENT accounts');
    err.statusCode = 403;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(validated.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      password: hashedPassword,
      role: 'STUDENT',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      borrowingLimit: true,
      createdAt: true,
    },
  });

  const token = generateToken(user);

  return { user, token };
};

/**
 * Login user with email and password.
 * Uses constant-time comparison via bcrypt.compare (prevents timing attacks).
 */
const login = async (data) => {
  const validated = loginSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { email: validated.email.toLowerCase() },
  });

  if (!user) {
    // Generic message prevents email enumeration attacks
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(validated.password, user.password);

  if (!isValid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      borrowingLimit: user.borrowingLimit,
    },
    token,
  };
};

/**
 * Generate JWT token with user payload.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { register, login };
