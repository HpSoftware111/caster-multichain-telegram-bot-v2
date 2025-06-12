Catster Telegram Bot

1. Run backend first.

2. Copy .env.example file to .env file

3. Write all corresponding params and backend url(example "http://localhost:8000/api") to .env file

In development and production:

1. `npm start`



Backend
1. npm run build
2. pm2 start "npm start" --name backend
if need to restart
pm2 restart backend
if need to stop
pm2 stop backend

Bot
pm2 start "npm start" --name tgbot
if need to restart
pm2 restart tgbot
if need to stop
pm2 stop tgbot
