import { z } from "zod";

export const user_schema = z.object({
  id: z.string(),
  username: z.string().min(1),
  email: z.string().optional().nullable(),
  email_verified: z.boolean().optional().default(false),
  role: z.enum(["admin", "vip3", "vip2", "vip1", "user"]).default("user"),
  created_at: z.date(),
  updated_at: z.date(),
  password_hash: z.string().min(1),
});

export type User = z.infer<typeof user_schema>;
