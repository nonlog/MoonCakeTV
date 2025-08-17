import { z } from "zod";

export const user_schema = z.object({
  id: z.string(),
  username: z.string().min(1),
  email: z.string().optional(),
  email_verified: z.boolean().optional().default(false),
  role: z.enum(["admin", "user"]),
  created_at: z.string(),
  updated_at: z.string().optional(),
  password_hash: z.string().min(1),
});

export type User = z.infer<typeof user_schema>;
