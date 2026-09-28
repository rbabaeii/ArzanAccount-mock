import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize';

export const phoneSchema = z
  .string()
  .min(1, 'شماره موبایل را وارد نمایید.')
  .transform(sanitizeString)
  .refine((val) => /^09\d{9}$/.test(val), {
    message: 'شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد (مانند 09120000000).',
  });

export const emailSchema = z
  .string()
  .min(1, 'ایمیل را وارد نمایید.')
  .email('فرمت ایمیل نامعتبر است.')
  .transform(sanitizeString);

export const passwordSchema = z
  .string()
  .min(1, 'رمز عبور را وارد نمایید.');

export const getAccountCredentialSchema = (requiresEmail: boolean, requiresPassword: boolean) => z.object({
  email: requiresEmail ? emailSchema : z.string().optional(),
  password: requiresPassword ? passwordSchema : z.string().optional(),
});

export const checkoutFormSchema = z.object({
  name: z.string().min(1, 'نام و نام خانوادگی خود را وارد نمایید.').transform(sanitizeString),
  phone: phoneSchema,
  email: emailSchema,
  nationalCode: z.string().optional().transform((val) => (val ? sanitizeString(val) : val)),
  targetAccountLink: z.string().optional().transform((val) => (val ? sanitizeString(val) : val)),
  targetAccountComments: z.string().optional().transform((val) => (val ? sanitizeString(val) : val)),
  agreed: z.boolean().refine((val) => val === true, {
    message: 'لطفاً قوانین و شرایط خرید را تایید نمایید.',
  }),
});
