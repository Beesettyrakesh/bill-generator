import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";
import { compare } from "bcryptjs";

export const authOptions = {
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
          console.log("User not found:", credentials.username);
          return null;
        }
        
        // Special handling for demo user
        if (credentials.username === "demo") {
          console.log("Demo login attempt");
        }
        
        // Compare password
        const isValid = await compare(credentials.password, user.password);
        
        if (isValid) {
          console.log("Login successful for:", credentials.username);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        } else {
          console.log("Invalid password for:", credentials.username);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-do-not-use-in-production",
};

export default NextAuth(authOptions);
