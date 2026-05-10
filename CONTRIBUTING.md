# Contributing to EcoScanAI

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Run `npm install`
3. Copy `.env.example` → `.env.local` and add your `GROQ_API_KEY`
4. Run `npm run dev` (or `vercel dev` for full serverless support)

## Code Style

- React components use functional style with hooks
- Tailwind utility classes for styling (avoid separate CSS unless needed)
- Keep components in `src/App.jsx` or split into `src/components/` for larger additions

## Submitting Changes

- Open an issue before starting significant work
- Keep PRs focused — one feature or fix per PR
- Test on mobile viewport (the app is mobile-first)
- Ensure `npm run build` completes without errors

## Reporting Bugs

Please include:
- Browser and OS
- Steps to reproduce
- Expected vs actual behaviour
- Screenshot if relevant

## Feature Requests

Open a GitHub Issue with the label `enhancement` and describe your idea and use case.
