/**
 * Zod Validation Schemas
 * Validates inputs strictly before database operations
 */
import { z } from 'zod';

// Helper to validate 18+ age from DOB
const validateAge18 = (dobStr) => {
  if (!dobStr) return false;
  const birth = new Date(dobStr);
  if (isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
};

const uuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Invalid UUID format'
);

// 1. Auth Schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address').transform(val => val.trim().toLowerCase()),
  phone: z.string().min(7, 'Please enter a valid phone number').optional().nullable(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  dob: z
    .string()
    .refine(validateAge18, { message: 'Must be at least 18 years of age to register' }),
  display_name: z.string().min(1).max(100).optional().nullable(),
  name: z.string().min(1).max(100).optional().nullable(),
  username: z.string().min(1).max(50).optional().nullable(),
  pseudonym: z.string().min(1).max(50).optional().nullable(),
  mode: z.enum(['public', 'stranger']).default('public'),
  gender: z.string().max(50).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  interested_in: z.array(z.string()).optional().default([]),
  intents: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  relationship_style: z.string().max(50).optional().nullable()
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or phone number is required').transform(val => val.trim()),
  loginIdentifier: z.string().optional(),
  password: z.string().min(1, 'Password is required')
});

// 2. Profile Update Schema
export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional().nullable(),
  pseudonym: z.string().min(1).max(50).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  hide_photo: z.boolean().optional(),
  mode: z.enum(['public', 'stranger']).optional(),
  gender: z.string().max(50).optional().nullable(),
  interested_in: z.array(z.string()).optional(),
  intents: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  relationship_style: z.string().max(50).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  location_lat: z.number().optional().nullable(),
  location_lng: z.number().optional().nullable()
});

// 3. User Feed Filter Schema
export const feedFilterSchema = z.object({
  minAge: z.coerce.number().min(18).max(100).optional(),
  maxAge: z.coerce.number().min(18).max(100).optional(),
  intent: z.string().optional(),
  relationship: z.string().optional(),
  interests: z.string().optional(),
  mode: z.enum(['public', 'stranger', 'all']).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0)
});

// 4. Reveal Request Schemas
export const revealRequestSchema = z.object({
  to_user: uuidSchema
});

export const revealResponseSchema = z.object({
  request_id: uuidSchema,
  status: z.enum(['approved', 'declined'])
});

// 5. Block Schema
export const blockUserSchema = z.object({
  blocked_id: uuidSchema
});

// 6. Safety Report Schema
export const reportSchema = z.object({
  reported_id: uuidSchema,
  reason: z.string().min(2, 'Reason must be at least 2 characters'),
  details: z.string().max(2000).optional().nullable()
});

// 7. Chats & Messages Schemas
export const chatStartSchema = z.object({
  target_user_id: uuidSchema
});

export const messageSendSchema = z.object({
  body: z.string().min(1, 'Message body cannot be empty').max(2000, 'Message cannot exceed 2000 characters')
});

// 8. Admin Schemas
export const adminVerifySchema = z.object({
  user_id: uuidSchema,
  status: z.enum(['approved', 'rejected']),
  review_note: z.string().max(1000).optional().nullable()
});

export const adminUserPatchSchema = z.object({
  status: z.enum(['pending', 'verified', 'banned']).optional(),
  role: z.enum(['user', 'admin']).optional()
});

export const adminChatLogSchema = z.object({
  reason: z.string().min(3, 'Audit reason is required to inspect private chat logs')
});
