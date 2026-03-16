export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-nicht-in-prod-verwenden',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'dev-refresh-secret-nicht-in-prod-verwenden',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
});
