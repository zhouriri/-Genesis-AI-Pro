export const logger = {
  info: (message: string, meta?: any) => {
    const log = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    console.log(JSON.stringify(log));
  },

  error: (message: string, meta?: any) => {
    const log = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    console.error(JSON.stringify(log));
  },

  warn: (message: string, meta?: any) => {
    const log = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    console.warn(JSON.stringify(log));
  },

  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === "development") {
      const log = {
        level: "debug",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      };
      console.debug(JSON.stringify(log));
    }
  },
};
