# راهنمای جامع راه‌اندازی فرانت‌اند ارزان‌اکانت (با دیتای ماک) روی سی‌پنل (cPanel)

این پروژه به گونه‌ای بازنویسی و پیاده‌سازی شده که **۱۰۰٪ مستقل از سرور بک‌اند و دیتابیس خارجی** است. تمامی عملیات‌های فروشگاه، احراز هویت، انبارداری، مدیریت سفارش‌ها، تایید پرداخت‌ها و تنظیمات از طریق دیتابیس درون مرورگر (`localStorage` و لایه شبیه‌ساز ماک) انجام می‌شوند.

بسته به نوع هاست سی‌پنل شما، دو روش برای بالا آوردن سایت وجود دارد:

---

## 🚀 روش اول: استفاده از ماژول Setup Node.js App (روش استاندارد و پیشنهادی)

اگر هاست سی‌پنل شما امکان اجرای Node.js را دارد (در صفحه اصلی cPanel بخش **Software** گزینه **Setup Node.js App** وجود دارد)، این ساده‌ترین روش است و نیازی به تغییر هیچ کدی نیست.

### گام ۱: زیپ کردن فایل‌های پروژه
از داخل پوشه `ArzanAccount/frontend`، یک فایل ZIP بسازید که شامل **تمامی فایل‌ها و پوشه‌ها به جز دو مورد زیر** باشد:
- ❌ پوشه `node_modules` (به هیچ وجه زیپ نشود - حجم بیهوده و ناسازگاری سیستم‌عامل)
- ❌ پوشه `.next` (در هاست دوباره بیلد می‌شود)

فایل‌های ضروری داخل زیپ:
`src/`, `public/`, `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`

### گام ۲: ساخت اپلیکیشن در cPanel
1. وارد cPanel شوید و روی **Setup Node.js App** کلیک کنید.
2. روی دکمه آبی رنگ **Create Application** کلیک کنید.
3. تنظیمات زیر را وارد کنید:
   - **Node.js version**: نسخه `18.x` یا `20.x` (پیشنهاد: آخرین نسخه 20)
   - **Application mode**: `Production`
   - **Application root**: نام پوشه‌ای که در هاست می‌خواهید فایل‌ها در آن قرار گیرد (مثلاً `arzan-front`)
   - **Application URL**: دامنه یا ساب‌دامنه‌ای که می‌خواهید سایت روی آن باز شود.
   - **Application startup file**: بنویسید `server.js` (یا خالی بگذارید تا خودکار ایجاد کند).
4. روی **Create** کلیک کنید.

### گام ۳: آپلود و استخراج فایل‌ها
1. در cPanel به بخش **File Manager** بروید.
2. وارد پوشه‌ای شوید که در مرحله قبل مشخص کردید (مثلاً `arzan-front`).
3. فایل ZIP خود را آپلود کرده و آن را **Extract** کنید.

### گام ۴: نصب پکیج‌ها و ساخت برنامه (Build)
1. به صفحه **Setup Node.js App** برگردید و اپلیکیشن خود را باز کنید (روی آیکون مداد Edit کلیک کنید).
2. روی دکمه **Run NPM Install** کلیک کنید و چند دقیقه منتظر بمانید تا پکیج‌ها نصب شوند.
3. برای اجرای بیلد، در بالای صفحه کادر دستوری وجود دارد (مثلاً `source /home/username/nodevenv/...`). وارد **Terminal** سی‌پنل شوید، آن دستور محیط مجازی را پیست کرده و سپس دستور زیر را بزنید:
   ```bash
   npm run build
   ```
4. در فایل `server.js` (که در ریشه برنامه است)، کد استاندارد زیر را قرار دهید یا اسکریپت استارت را اجرا کنید:
   ```javascript
   const { createServer } = require('http');
   const { parse } = require('url');
   const next = require('next');

   const dev = false;
   const app = next({ dev });
   const handle = app.getRequestHandler();
   const port = process.env.PORT || 3000;

   app.prepare().then(() => {
     createServer((req, res) => {
       const parsedUrl = parse(req.url, true);
       handle(req, res, parsedUrl);
     }).listen(port, (err) => {
       if (err) throw err;
       console.log(`> Ready on port ${port}`);
     });
   });
   ```
5. در صفحه Setup Node.js App روی **Restart** کلیک کنید. سایت شما بالا می‌آید!

---

## ⚡ روش دوم: خروجی کاملاً استاتیک HTML/CSS/JS (مناسب هاست اشتراکی ساده)

اگر هاست شما یک هاست اشتراکی ساده است و ماژول Node.js ندارد، می‌توانید کل پروژه را به فایل‌های استاتیک HTML تبدیل کرده و مستقیماً داخل `public_html` بریزید.

### گام ۱: آماده‌سازی تنظیمات برای خروجی استاتیک
در فایل `next.config.mjs`:
۱. ویژگی `output: 'export'` و `images: { unoptimized: true }` را اضافه کنید.
۲. بخش `rewrites()` را کامنت یا حذف کنید (چون بک‌اندی وجود ندارد).
۳. فایل `src/middleware.ts` را تغییر نام دهید (مثلاً به `_middleware.ts.bak`) زیرا وب‌سرور آپاچی از میدل‌ورهای Node.js پشتیبانی نمی‌کند (نگران نباشید، امنیت پنل ادمین توسط کامپوننت کلاینت `src/app/admin/layout.tsx` به صورت خودکار برقرار است).

نمونه تنظیمات `next.config.mjs` برای خروجی استاتیک:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### گام ۲: بیلد گرفتن
در سیستم خود دستور زیر را اجرا کنید:
```bash
npm run build
```
یک پوشه به نام `out` در ریشه پروژه ایجاد می‌شود که حاوی تمامی فایل‌های آماده HTML, CSS و JS است.

### گام ۳: فایل `.htaccess` برای آپاچی سی‌پنل
یک فایل با نام `.htaccess` در ریشه پوشه `out` بسازید تا روت‌های تک‌صفحه‌ای (SPA) و صفحات مختلف با رفرش شدن دچار خطای 404 نشوند:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # اگر فایل با پسوند html وجود دارد
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule !.*\.html$ %{REQUEST_FILENAME}.html [L]

  # سایر مسیرها برای کلاینت روتینگ
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /index.html [L]
</IfModule>

# هدرهای امنیتی
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
</IfModule>
```

### گام ۴: آپلود در `public_html`
1. محتویات داخل پوشه `out` (همراه با فایل `.htaccess`) را زیپ کنید.
2. در سی‌پنل وارد **File Manager** شده و به پوشه **`public_html`** بروید.
3. فایل زیپ را آپلود و **Extract** کنید.
4. اکنون سایت شما مستقیماً با باز کردن دامنه لود خواهد شد!

---

## 🔑 اطلاعات ورود پیش‌فرض (تستی) به پنل مدیریت
- **شماره موبایل مدیر ارشد:** `09181111111`
- **کد تایید ورود:** `11111` (یا هر کد ۵ رقمی دلخواه)
- همچنین می‌توانید در صفحه لاگین با یک کلیک روی دکمه «مدیر ارشد (Super Admin)» وارد شوید.
