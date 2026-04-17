import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";
import { compare } from "bcryptjs";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is not set. Please add it to your .env.local file.");
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db("bill-generator");
        const user = await db.collection("users").findOne({
          username: credentials.username
        });

        if (!user) {
          return null;
        }

        // Compare password
        const isValid = await compare(credentials.password, user.password as string);

        if (isValid) {
          return {
            id: user.id as string,
            name: user.name as string,
            email: user.email as string,
            role: user.role as string,
          };
        } else {
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
