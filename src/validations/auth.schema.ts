import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize';

export const phoneSchema = z
  .string()
  .min(1, 'شماره موبایل را وارد نمایید.')
  .transform(sanitizeString)
  .refine((val) => /^09\d{9}$/.test(val), {
    message: 'شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد (مانند 09180000000).',
  });

export const otpCodeSchema = z
  .string()
  .min(1, 'کد تایید را وارد نمایید.')
  .transform(sanitizeString)
  .refine((val) => val.length >= 4 && val.length <= 6, {
    message: 'کد تایید معتبر نیست.',
  });

export const passwordSchema = z
  .string()
  .min(1, 'رمز عبور را وارد نمایید.')
  .min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد.')
  .max(100, 'رمز عبور بیش از حد طولانی است.');

export const referralCodeSchema = z
  .string()
  .optional()
  .transform((val) => (val ? sanitizeString(val) : val))
  .refine((val) => !val || val.length <= 50, {
    message: 'کد معرف بیش از حد طولانی است.',
  });

export const loginWithPasswordSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  referralCode: referralCodeSchema,
});
