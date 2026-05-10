# Security Policy

## API Keys

- **Never** commit `.env.local` or any file containing your `GROQ_API_KEY`
- The `.gitignore` in this repo already excludes `.env*` files
- On Vercel, add your key via **Project Settings → Environment Variables**

## Reporting a Vulnerability

If you discover a security issue, please open a GitHub Issue marked `[SECURITY]`
or contact the maintainer privately before disclosing publicly.
