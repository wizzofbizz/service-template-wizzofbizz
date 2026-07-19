
import { getPublicBaseUrl, isGoogleAuthConfigured } from "./config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Augment Express.User type
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      businessId: string | null;
      role: string;
      isActive: boolean;
    }
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  if (!process.env.SESSION_SECRET) {
    console.warn("SESSION_SECRET not set, using default. This is insecure for production!");
  }
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

async function upsertUser(profile: any) {
  const email = profile.emails?.[0]?.value || null;
  const firstName = profile.name?.givenName || null;
  const lastName = profile.name?.familyName || null;
  const profileImageUrl = profile.photos?.[0]?.value || null;

  await storage.upsertUser({
    id: profile.id,
    email,
    firstName,
    lastName,
    profileImageUrl,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const callbackURL = `${getPublicBaseUrl()}/api/callback`;

  // Google sign-in is optional. Without credentials we simply do not register
  // the strategy — email/password login still works and the app still boots.
  if (!isGoogleAuthConfigured()) {
    console.warn(
      "ℹ️  Google sign-in disabled (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set). " +
      "Email + password login is unaffected."
    );
    return;
  }

  console.log(`🔧 Google OAuth callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          await upsertUser(profile);
          
          const dbUser = await storage.getUser(profile.id);
          if (!dbUser) {
            return done(new Error("User not found"), undefined);
          }
          
          const user: Express.User = {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            profileImageUrl: dbUser.profileImageUrl,
            businessId: dbUser.businessId,
            role: dbUser.role || "owner",
            isActive: dbUser.isActive ?? true,
          };
          
          done(null, user);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, cb) => {
    console.log("🔹 Serializing user:", user.id);
    cb(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, cb) => {
    console.log("🔹 Deserializing user ID:", id);
    try {
      const dbUser = await storage.getUser(id);
      console.log("🔹 Found user in DB:", dbUser ? `${dbUser.email} (businessId: ${dbUser.businessId})` : "NOT FOUND");
      
      if (!dbUser) {
        console.error("❌ User not found in database:", id);
        return cb(null, false); // Return false instead of error
      }
      
      const user: Express.User = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
        businessId: dbUser.businessId,
        role: dbUser.role || "owner",
        isActive: dbUser.isActive ?? true,
      };
      
      console.log("✅ Deserialized user successfully:", user.email);
      cb(null, user);
    } catch (error) {
      console.error("❌ Error in deserializeUser:", error);
      cb(null, false); // Return false instead of error
    }
  });

  app.get("/api/login", (req, res, next) => {
    console.log("🔐 Login request initiated");
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("🔄 Callback received");
    passport.authenticate("google", {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
      failureFlash: false,
    }, (err, user, info) => {
      if (err) {
        console.error("❌ Authentication error:", err);
        return next(err);
      }
      if (!user) {
        console.error("❌ Authentication failed:", info);
        return res.redirect("/login");
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("❌ Login error:", err);
          return next(err);
        }
        console.log("✅ User logged in successfully:", user.email);
        return res.redirect("/dashboard");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const requireAuth = isAuthenticated;
export const setupGoogleAuth = setupAuth;

export const attachBusinessContext: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  next();
};
