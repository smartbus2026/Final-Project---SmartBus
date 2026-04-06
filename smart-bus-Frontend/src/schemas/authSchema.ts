import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(3, "Name is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["student", "admin"]),
  student_id: z.string().optional(),
  phone_number: z.string().min(10, "Invalid phone number"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "student" && !data.student_id) return false;
  return true;
}, {
  message: "Student ID is required for students",
  path: ["student_id"],
});

export type SignupSchemaType = z.infer<typeof signupSchema>;

// login schema (for future use in Login page)

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;