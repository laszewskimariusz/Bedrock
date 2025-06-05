# Bedrock

This project aims to build a full-featured Notion clone using Next.js and Supabase.

## Development

1. Copy `.env.example` to `.env.local` and fill in your Supabase details and project secrets (`Resend`, `DB_URL`, `DP_PASS`).
2. Install dependencies with `npm install` (requires internet access).
3. Run the development server with `npm run dev`.
4. Run tests with `npm test`. The project uses Node's built-in test runner (Node.js 20+), so no extra dependencies are needed.

The current version includes a simple homepage and basic authentication forms for login and registration using Supabase and Resend. A button at the top of the page lets you switch between dark and bright themes.
