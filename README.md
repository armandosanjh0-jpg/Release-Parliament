# Release-Parliament

A lightweight platform focused on **Canada's Parliament** where citizens can:
- Browse parliamentary bills from 2005 onward.
- Inspect how House of Commons MPs and Senators voted on each bill.
- View upcoming bills scheduled for vote.
- Cast their own citizen vote (Yea/Nay/Abstain).
- Ask GPT for a bill synopsis with a **centre-right lens by default** (or switch to neutral).

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## GPT synopsis (optional)

Set environment variables to use OpenAI for synopsis generation:

```bash
export OPENAI_API_KEY=your_key_here
export OPENAI_MODEL=gpt-4.1-mini
npm start
```

Without `OPENAI_API_KEY`, the app uses a local synopsis fallback.

## Tests

```bash
npm test
```
