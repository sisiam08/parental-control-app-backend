import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/database";
import env from "../../config/env";
import { AppError } from "../../middleware/globalErrorHandler";

export class AuthService {
  private generateTokens(payload: { id: string; email: string; role: string; familyId: string | null }) {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
    return { accessToken, refreshToken };
  }

  async registerParent(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, "A user with this email address already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Run in transaction: Create Family, then create User
    const result = await prisma.$transaction(async (tx: any) => {
      const family = await tx.family.create({
        data: {
          name: `${name}'s Family`,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "PARENT",
          familyId: family.id,
        },
      });

      return { user, family };
    });

    const tokens = this.generateTokens({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      familyId: result.user.familyId,
    });

    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    await prisma.session.create({
      data: {
        userId: result.user.id,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: result.user.id,
        action: "REGISTER",
        details: "Parent user registered and default family created",
      },
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        familyId: result.user.familyId,
      },
      ...tokens,
    };
  }

  async loginParent(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { family: true },
    });

    if (!user) {
      throw new AppError(401, "Invalid email address or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, "Invalid email address or password");
    }

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      familyId: user.familyId,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        details: "Parent user logged in successfully",
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        id: string;
        email: string;
        role: string;
        familyId: string | null;
      };

      const session = await prisma.session.findUnique({
        where: { refreshToken: token },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new AppError(401, "Invalid or expired session refresh token");
      }

      // Generate rotated pair
      const tokens = this.generateTokens({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        familyId: decoded.familyId,
      });

      // Update current session with rotated token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt,
        },
      });

      return tokens;
    } catch (err) {
      throw new AppError(401, "Refresh token verification failed");
    }
  }

  async logoutParent(token: string) {
    await prisma.session.updateMany({
      where: { refreshToken: token },
      data: { isActive: false },
    });
  }
}
