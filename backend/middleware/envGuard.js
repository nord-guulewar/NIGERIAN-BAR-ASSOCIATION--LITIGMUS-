const SECURITY = {
  NODE_ENV: {
    required: false,
    default: 'development',
    description: 'Application environment'
  },
  PORT: {
    required: false,
    default: 5000,
    description: 'Server port number',
    type: 'number'
  },
  DATABASE_URL: {
    required: false,
    description: 'PostgreSQL connection string (required for production)'
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT signing secret (MUST be 32+ chars in production)',
    minLength: 32
  },
  SESSION_SECRET: {
    required: false,
    description: 'Session secret (session currently disabled; set for future use)',
    minLength: 32
  },
  ENCRYPTION_KEY: {
    required: false,
    description: '32-byte AES-256 encryption key for sensitive field storage',
    minLength: 32
  },
  FRONTEND_URL: {
    required: true,
    description: 'Allowed CORS origin in production'
  },
  CORS_WHITELIST: {
    required: false,
    description: 'Comma-separated list of additional allowed CORS origins',
    default: ''
  }
};

const validateEnv = () => {
  const missing = [];
  const weak = [];

  for (const [key, config] of Object.entries(SECURITY)) {
    const value = process.env[key];

    if (config.required && (!value || value.trim() === '')) {
      missing.push(`  - ${key} (${config.description})`);
    }

    if (
      value &&
      config.minLength &&
      value.length < config.minLength &&
      process.env.NODE_ENV === 'production'
    ) {
      weak.push(
        `  - ${key} is only ${value.length} chars (min ${config.minLength}). ${config.description}`
      );
    }
  }

  if (missing.length > 0 || weak.length > 0) {
    console.error('\n\x1b[31m%s\x1b[0m', '=== SECURITY CONFIGURATION ERRORS ===');
    if (missing.length > 0) {
      console.error('Missing required environment variables:');
      missing.forEach((m) => console.error(m));
    }
    if (weak.length > 0) {
      console.error('Weak configuration detected:');
      weak.forEach((w) => console.error(w));
    }
    console.error(
      '\x1b[33m%s\x1b[0m\n',
      'Server startup ABORTED. Fix the above and try again.\n'
    );
    const error = new Error('Invalid environment configuration');
    error.code = 'INVALID_ENV_CONFIGURATION';
    error.details = { missing, weak };
    throw error;
  }

  console.log('\x1b[32m%s\x1b[0m', '✓ Environment configuration validated');
};

module.exports = { validateEnv, SECURITY };
