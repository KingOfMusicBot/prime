# PrimeStudy (Heroku Ready)

Project ko Heroku one-click deploy ke liye ready kar diya gaya hai.

## One-Click Deploy

`app.json` mein saare required config vars define hain, isliye deploy ke time ek hi form mein values fill hongi.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/<your-username>/<your-repo>)

Important:
- Deploy button use karne ke liye pehle code GitHub repo mein push hona chahiye.
- Upar wale URL mein `<your-username>/<your-repo>` ko apne actual GitHub repo se replace karein.

## Included Heroku Setup

- `Procfile`: `web: npm run start:heroku`
- `package.json` script: `start:heroku` uses Heroku `PORT`
- `app.json`: one-shot env var setup form
- `.env.example`: local/dev reference variables

## Local Run

```bash
npm install
npm run dev
```
