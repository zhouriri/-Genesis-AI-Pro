import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";

  logger.error(`Error: ${err.message}`, {
    statusCode,
    errorCode,
    path: req.path,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      ...(err.details && { details: err.details }),
    },
  });
};

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR", details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}
