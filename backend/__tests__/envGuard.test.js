const path = require('path');

describe('envGuard', () => {
  const originalEnv = process.env;
  let exitSpy;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    if (exitSpy) exitSpy.mockRestore();
  });

  it('exports validateEnv and SECURITY', async () => {
    const mod = require('../middleware/envGuard');
    expect(typeof mod.validateEnv).toBe('function');
    expect(typeof mod.SECURITY).toBe('object');
  });

  it('does not exit when required variables are present in development', () => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.JWT_SECRET = 'a'.repeat(40);
    process.env.SESSION_SECRET = 'b'.repeat(40);
    process.env.ENCRYPTION_KEY = 'c'.repeat(32);
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const mod = require('../middleware/envGuard');
    expect(() => mod.validateEnv()).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 1 when JWT_SECRET is too short in production', () => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.JWT_SECRET = 'short';
    process.env.SESSION_SECRET = 'b'.repeat(40);
    process.env.ENCRYPTION_KEY = 'c'.repeat(32);
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const mod = require('../middleware/envGuard');
    mod.validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when a required variable is missing', () => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    process.env.JWT_SECRET = 'a'.repeat(40);
    process.env.SESSION_SECRET = 'b'.repeat(40);
    process.env.ENCRYPTION_KEY = 'c'.repeat(32);
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const mod = require('../middleware/envGuard');
    mod.validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('requestTimeout', () => {
  it('exports a function that returns middleware', () => {
    const timeout = require('../middleware/requestTimeout');
    expect(typeof timeout).toBe('function');
    const middleware = timeout(10);
    expect(typeof middleware).toBe('function');
  });
});

describe('server env loading', () => {
  it('loads server from backend directory', () => {
    const resolved = require.resolve('../server');
    expect(resolved).toBe(path.join(__dirname, '..', 'server.js'));
  });
});

describe('security middleware exports', () => {
  it('exports all rate limiters and sanitizers', () => {
    const sec = require('../middleware/security');
    const required = [
      'xssProtection', 'noSqlInjectionProtection', 'parameterPollutionProtection',
      'loginRateLimiter', 'verificationRateLimiter', 'passwordResetRateLimiter',
      'recoveryLoginRateLimiter', 'docketRateLimiter', 'uploadRateLimiter',
      'secureHeaders', 'logDataAccess'
    ];
    for (const name of required) {
      expect(typeof sec[name]).toBe('function');
    }
  });
});
