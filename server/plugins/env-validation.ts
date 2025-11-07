/**
 * Nitro plugin to validate environment variables on server startup
 *
 * This plugin runs once when the server starts and validates all
 * required environment variables using Zod schemas.
 *
 * If validation fails, the server will not start and detailed error
 * messages will be logged to help identify configuration issues.
 */
export default defineNitroPlugin(() => {
  const logger = envLogger

  logger.info('Validating environment variables...')

  try {
    const env = validateEnv()

    logger.success('Environment validation successful')
    logger.info(`   NODE_ENV: ${env.NODE_ENV}`)
    logger.info(
      `   LOG_LEVEL: ${env.LOG_LEVEL ?? '(auto)'} (0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace)`
    )
    logger.info(`   NUXT_PUBLIC_LOG_LEVEL: ${env.NUXT_PUBLIC_LOG_LEVEL ?? '(auto)'}`)
    logger.info(`   HOST: ${env.HOST}`)
    logger.info(`   PORT: ${env.PORT}`)
    logger.info(`   REGISTRY_URL: ${env.REGISTRY_URL}`)
    logger.info(`   REGISTRY_USERNAME: ${env.REGISTRY_USERNAME ? '***' : '(not set)'}`)
    logger.info(`   REGISTRY_PASSWORD: ${env.REGISTRY_PASSWORD ? '***' : '(not set)'}`)
    logger.info(`   REGISTRY_TOKEN_CACHE_TTL: ${env.REGISTRY_TOKEN_CACHE_TTL}s`)
    logger.info(`   ENABLE_USER_LOGGING: ${env.ENABLE_USER_LOGGING}`)

    // Security warnings
    if (env.NODE_ENV === 'production') {
      if (env.HOST !== '127.0.0.1') {
        logger.warn('WARNING: HOST is not 127.0.0.1 in production. Ensure proper firewall rules!')
      }
    }

    if (!env.REGISTRY_PASSWORD && !env.REGISTRY_USERNAME) {
      logger.warn('WARNING: No registry credentials configured. Assuming anonymous access.')
    }

    // Check for development defaults
    if (env.REGISTRY_URL === 'http://localhost:5000') {
      logger.info('Using default development registry URL: http://localhost:5000')
      logger.info('   Set REGISTRY_URL in .env to connect to your Docker Registry')
    }
  } catch (error) {
    logger.error('Environment validation failed! Server cannot start.')
    logger.error('Please check your .env file or environment variables configuration.')
    logger.error('See .env.example for required variables and their documentation.')

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }

    // In development, log the error but allow server to start
    logger.error(error)
    logger.warn('Server starting with invalid configuration (development mode)')
  }
})
