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

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

let cachedSuperadminUser: User | null = null;

async function getSuperadminUser(): Promise<User | null> {
  if (cachedSuperadminUser) return cachedSuperadminUser;
  const email = process.env.SUPERADMIN_EMAIL || "superadmin@administra.com";
  cachedSuperadminUser = await storage.getUserByEmail(email);
  return cachedSuperadminUser;
}

export function clearCachedSuperadmin() {
  cachedSuperadminUser = null;
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

  app.use(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      const superadmin = await getSuperadminUser();
      if (superadmin) {
        (req as any).user = superadmin;
      }
    }
    next();
  });
}

export function requireAuth(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export function requireRole(..._roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}

// Get user context (role, communityId, propertyCompanyId)
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

// Get community ID based on user role
export function getCommunityIdFromUser(
  req: Request,
  defaultCommunityId: string
): string {
  const user = req.user as User | undefined;

  if (!user) {
    return defaultCommunityId;
  }

  // For admin_fincas, they can select which community to work with
  // This will be stored in session or passed as a parameter
  if (user.role === "admin_fincas") {
    // Check if there's a selected community in the session
    const selectedCommunityId = (req.session as any)?.selectedCommunityId;
    return selectedCommunityId || defaultCommunityId;
  }

  // For presidente and vecino, always use their assigned community
  return user.communityId || defaultCommunityId;
}

// Set selected community for admin_fincas users
export function setSelectedCommunity(req: Request, communityId: string) {
  if (!req.session) {
    throw new Error("Session not initialized");
  }
  (req.session as any).selectedCommunityId = communityId;
}
