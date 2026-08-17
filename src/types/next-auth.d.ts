import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "BUYER" | "CREATOR" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "BUYER" | "CREATOR" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "BUYER" | "CREATOR" | "ADMIN";
  }
}
