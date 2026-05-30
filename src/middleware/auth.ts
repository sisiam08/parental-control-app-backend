import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";
import prisma from "../config/database";
import { AppError } from "./globalErrorHandler";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    familyId: string | null;
  };
  device?: {
    id: string;
    childId: string;
    deviceName: string;
  };
}

export const authenticateParent = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token = "";

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError(401, "Authentication credentials required");
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      email: string;
      role: string;
      familyId: string | null;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, familyId: true },
    });

    if (!user) {
      throw new AppError(401, "User associated with this token not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError(401, "Invalid or expired access token"));
  }
};

export const authenticateDevice = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let deviceToken = req.headers["x-device-token"] as string;

    if (!deviceToken && req.headers.authorization?.startsWith("Bearer ")) {
      deviceToken = req.headers.authorization.split(" ")[1];
    }

    if (!deviceToken) {
      throw new AppError(401, "Companion device authorization required");
    }

    const device = await prisma.device.findUnique({
      where: { deviceToken },
      select: { id: true, childId: true, deviceName: true },
    });

    if (!device) {
      throw new AppError(401, "Unregistered or invalid device token");
    }

    req.device = device;
    next();
  } catch (error) {
    next(error);
  }
};
