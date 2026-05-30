import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import router from "./routes";
import { notFound } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { apiLimiter } from "./middleware/rateLimiter";

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // Extra buffer capacity for screen spy telemetry uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// General limit applied to standard API requests
app.use("/api/v1", apiLimiter);

// Mount core parental control routes
app.use("/api/v1", router);

// Handle unknown route 404s
app.use(notFound);

// Standardized error pipeline
app.use(globalErrorHandler);

export default app;
