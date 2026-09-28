import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.')
    .max(100, 'نام و نام خانوادگی بیش از حد طولانی است.')
    .transform(sanitizeString),
  email: z
    .string()
    .email('ایمیل وارد شده نامعتبر است.')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? sanitizeString(val) : val)),
  nationalCode: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? sanitizeString(val) : val))
    .refine((val) => {
      if (!val) return true;
      if (!/^\d{10}$/.test(val)) return false;
      if (/^(\d)\1{9}$/.test(val)) return false;
      const check = parseInt(val[9]);
      const sum = val.split('').slice(0, 9).reduce((acc, curr, i) => acc + parseInt(curr) * (10 - i), 0);
      const rem = sum % 11;
      return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
    }, {
      message: 'کد ملی وارد شده نامعتبر است.',
    }),
  birthDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? sanitizeString(val) : val))
    .refine((val) => !val || /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(val), {
      message: 'تاریخ تولد باید با فرمت YYYY/MM/DD و مقادیر معتبر ماه و روز باشد.',
    }),
  jobTitle: z
    .string()
    .max(100, 'عنوان شغلی بیش از حد طولانی است.')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? sanitizeString(val) : val)),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(1, 'رمز عبور جدید الزامی است.')
    .min(6, 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.')
    .max(100, 'رمز عبور جدید بیش از حد طولانی است.'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'تکرار رمز عبور با رمز عبور جدید تطابق ندارد.',
  path: ['confirmPassword']
});
