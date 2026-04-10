import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: app.get("env") === "production",
      sameSite: "lax",
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email.toLowerCase());
          if (!user) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          const isValid = await verifyPassword(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as User;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export function getUserContext(req: Request) {
  const user = req.user as User | undefined;
  
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
    communityId: user.communityId,
    propertyCompanyId: user.propertyCompanyId,
  };
}

export function getCommunityIdFromUser(
  req: Request,
  defaultCommunityId: string
): string {
  const user = req.user as User | undefined;

  if (!user) {
    return defaultCommunityId;
  }

  if (user.role === "admin_fincas") {
    const selectedCommunityId = (req.session as any)?.selectedCommunityId;
    return selectedCommunityId || defaultCommunityId;
  }

  return user.communityId || defaultCommunityId;
}

export function setSelectedCommunity(req: Request, communityId: string) {
  if (!req.session) {
    throw new Error("Session not initialized");
  }
  (req.session as any).selectedCommunityId = communityId;
}
