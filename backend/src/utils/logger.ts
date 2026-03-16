const logger = {
  info: (message: string, meta?: object): void => {
    console.log(`[${new Date().toISOString()}] [INFO]`, message, meta ?? '')
  },
  warn: (message: string, meta?: object): void => {
    console.warn(`[${new Date().toISOString()}] [WARN]`, message, meta ?? '')
  },
  error: (message: string, meta?: object): void => {
    console.error(`[${new Date().toISOString()}] [ERROR]`, message, meta ?? '')
  },
  debug: (message: string, meta?: object): void => {
    console.log(`[${new Date().toISOString()}] [DEBUG]`, message, meta ?? '')
  },
}

export default logger
