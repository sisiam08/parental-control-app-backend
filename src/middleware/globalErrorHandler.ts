import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
export { AppError };
import logger from "../config/logger";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError && err.isOperational
      ? err.message
      : process.env.NODE_ENV === "development"
      ? err.message
      : "Something went wrong";

  logger.error(`${err.constructor.name}: ${err.message}`, {
    stack: err.stack,
    path: _req.originalUrl,
    method: _req.method,
  });

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
