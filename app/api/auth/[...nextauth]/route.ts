// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  // You can configure callbacks here if you want to
  // access the token or session, e.g.:
  callbacks: {
    async session({ session,  }) {
      // The 'session.user' is the default shape.
      // You can attach `id` or other custom fields here if needed.
      // For example:
      // session.user.id = token.sub ?? null
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
