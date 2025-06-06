import { Elysia } from 'elysia';
import fetch from 'node-fetch';

export function keepAlive() {
  const app = new Elysia();

  app.get('/', () => 'Bot is alive!');

  const port = process.env.PORT || 2333;

  const startServer = async () => {
    await app.fetch(new Request(`http://localhost:${port}`));
    console.log(`✅ KeepAlive server is running on http://localhost:${port}`);

    const pingSelf = () => {
      setInterval(async () => {
        try {
          console.log('⚡ Pinging self to prevent sleep...');
          await fetch(`http://localhost:${port}/`);
        } catch (error) {
          console.error('Error while pinging self:', error);
        }
      }, 5 * 60 * 1000);
    };
    pingSelf();
  };
  startServer();
}
