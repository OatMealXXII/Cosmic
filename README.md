# 🌌 Cosmic
Discord Music Bot made with discord.js and Shoukaku to play song in discord server by Lavalink.

<p align="center">
    <img src="https://storage.googleapis.com/hikara_bucket/OatMeal/Cosmic.png"> 
</p>

## สำหรับภาษาไทย
- [Readme](https://github.com/OatMealXXII/Cosmic/blob/main/README_TH.md)

## ⬆️ Top features
- 📕 Use [Shoukaku](https://github.com/shipgirlproject/Shoukaku) Client
- 💡 Easy to use
- 🏳️ Thai language
- 🕹️ Comfort for Thai language
- 🛒 Queue system and skip command
- 🔉 Volume control
- ⛈️ Fast
- 🔊 High quality sound
- 🏁 Full Typescript support!

## ❓ Requirements
- Node.js lastest LTS [Node.js](https://nodejs.org/en)
- Discord Bot Token ([Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))
- Lavalink (see this [Lavalink](https://lavalink.dev/))

## 🏁 Getting Started

> 💡 We recommend using `bun` for performance and speed.

### Fast using: [Cosmic](https://discord.com/oauth2/authorize?client_id=1322918992679145553&permissions=8&integration_type=0&scope=bot)

- Clone the repository
```bash
git clone https://github.com/OatMealXXII/Cosmic
```
<br />
- Install dependencies <br />

```bash
bun install
``` 
or

```bash
npm install
```
<br />

- Install typescript tools <br />

```bash
npm install -g typescript
```

```bash
npm install -g npx
``` 

```bash
npm install -g tsx
```

```bash
npm install -g ts-node
```
<br />

- Change `.env.example` to `.env` and put Bot Token into `TOKEN = ''` <br />

- Config your Lavalink Node in `src/config/node.ts` <br />
 Default is `{
    name: 'LocalNode',
    url: '127.0.0.1:2333',
    auth: 'youshallnotpass',
    secure: false,
  }` <br />
  
- initializing bot by <br />

```bash
bun start
```
or
```bash
npm start
```

## License
This project is licensed under the [GNU General Public License v3.0](LICENSE) - see the [LICENSE](LICENSE) file for details. <br />
You can modify and publish but you must provide attribution by linking back to original repository and include this copyright notice.

## Credits
- [OatMealXXII](https://github.com/OatMealXXII) - Cosmic Creator & Cosmic Developer
- [Shoukaku](https://github.com/shipgirlproject/Shoukaku) - Node.js Library arround Lavalink
- [Soundy](https://github.com/idMJA/Soundy) - My Inspiration
