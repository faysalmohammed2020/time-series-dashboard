import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  user: {
    modelName: "users",
    additionalFields: {
      role: { type: "string", required: true },
      division: { type: "string", required: false },
      district: { type: "string", required: false },
      area: { type: "string", required: false },
      upazila: { type: "string", required: false },
      union: { type: "string", required: false },
      markaz: { type: "string", required: false },
      phone: { type: "string", required: false },
    },
  },

  session: {
    modelName: "sessions",
  },

  account: {
    modelName: "accounts",
  },

  verification: {
    modelName: "verifications",
  },

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    admin({
      defaultRole: "superadmin",
      adminRole: ["superadmin", "admin", "user"],
    }),
  ],
});
