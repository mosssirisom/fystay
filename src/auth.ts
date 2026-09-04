import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { googleSignInEnabled } from "@/lib/authProviders";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Trust the Host header from the deployment platform's proxy (Vercel, etc.).
  // Without this, NextAuth v5 rejects every request in production mode
  // ("UntrustedHost") since it can't otherwise tell a real request apart
  // from one with a spoofed Host header.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        // No account, or one created via Google that's never also set a
        // password: either way there's nothing to check the password
        // against, so deny rather than passing null into bcrypt.
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    ...(googleSignInEnabled
      ? [
          Google({
            // The default profile() return has no `role` field, which this
            // app's User type (src/types/next-auth.d.ts) requires - GUEST
            // here is only ever a placeholder for the moment between
            // sign-in and the jwt callback below, which always overwrites
            // it with the real value from this account's own User row.
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                role: "GUEST",
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      // Credentials sign-in already resolved to a real User row in
      // authorize() above; Google only ever hands back its own profile, so
      // the first time a given email signs in this way, create the User
      // row that everything else in this app (bookings, listings, reviews)
      // actually points to. passwordHash stays null - see the schema
      // comment on User.passwordHash for why that's a real, expected state
      // rather than a bug.
      const email = user.email.toLowerCase();
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: user.name ?? email, image: user.image },
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        // Google's own profile has no idea about this app's id/role - look
        // up the real User row signIn() above just found-or-created.
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
        return token;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "GUEST" | "HOST" | "ADMIN";
      }
      return session;
    },
  },
});
