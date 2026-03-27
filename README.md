Release Parliament

Read every bill in Canada's Parliament. See how your MP voted. Cast your own citizen vote.

Release Parliament is a free, open-source civic tool that makes Canadian democracy more accessible. Browse bills going back to 2005, inspect real House of Commons and Senate vote records, and make your voice heard — all in one place.

Features

Live parliamentary data — bills and votes pulled directly from the OpenParliament API, updated every 10 minutes
MP & Senator vote records — see exactly how each member voted on every bill
Citizen voting — cast your own Yea / Nay / Abstain on any bill
AI bill synopsis — get a plain-language summary of any bill, with a centre-right or neutral lens (requires OpenAI API key)
No login required — open to every Canadian, no account needed


Quick start
Make sure you have Node.js v18 or later installed.
bashgit clone https://github.com/armandosanjh0-jpg/Release-Parliament.git
cd Release-Parliament
npm start
Then open http://localhost:3000 in your browser.

AI synopsis (optional)
To enable AI-powered bill summaries, set your OpenAI API key before starting the server:
bashexport OPENAI_API_KEY=your_key_here
export OPENAI_MODEL=gpt-4.1-mini   # optional, this is the default
npm start
Without an API key the app falls back to a built-in local summary — everything else still works.

Contributing
Pull requests are welcome. If you find a bug or want to suggest a feature, open an issue.

Data sources

Parliamentary bills and votes: OpenParliament.ca — free and open
AI summaries: OpenAI (optional, bring your own key)


License
MIT — free to use, fork, and build on.
