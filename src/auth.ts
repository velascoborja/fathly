import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    async deleteSession(sessionToken) {
      // Account deletion may already have cascaded to this session.
      await prisma.session.deleteMany({ where: { sessionToken } })
    },
  },
  secret:
    process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : "fathly-development-auth-secret"),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  events: {
    async signIn({ user, account, profile }) {
      if (
        account?.provider === "google" &&
        profile?.email_verified === true &&
        typeof profile.email === "string" &&
        user.id
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: profile.email.trim().toLowerCase(), emailVerified: new Date() },
        })
      }
    },
  },
  callbacks: {
    signIn({ account, profile }) {
      return account?.provider === "google" && profile?.email_verified === true
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }

      return session
    },
  },
})
