# FinBuddy AI

Build a web app called "AI CFO", an AI finance controller dashboard.

Features:

CSV upload for transactions with columns: date, description, vendor, category, amount, type (income/expense)

Auto-categorize uncategorized transactions using the Google Gemini API

Dashboard showing: monthly burn rate, cash runway, top 5 expense categories (chart), month-over-month expense trend (chart), and flagged anomalies (duplicate payments, unusually large amounts vs category average)

A chat panel where the user asks questions in plain English (e.g., "Why did expenses spike in July?", "What's our runway?"). Send the transaction summary + question to the Gemini API and answer like a CFO with specific numbers

Include a "Load sample data" button with realistic Indian startup transactions (salaries, AWS, marketing, GST payments, Razorpay fees), include one hidden duplicate payment and a July expense spike in the sample data

Clean professional fintech design: dark sidebar, cards, charts

Store the Gemini API key as an environment variable/secret, never hardcode it.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ai-cfo-buddy-20.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/20b3873b-3aab-400b-91c2-9c2af6cdd2af).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
