import type { LavalinkNodeConfig } from '../types/lavalinkNode.ts'
import { fileURLToPath } from 'url';
import { configDotenv } from 'dotenv';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
configDotenv({ path: path.resolve(__dirname, '../../.env') });

const Nodes: LavalinkNodeConfig[] = [
  {
    name: 'LocalNode',
    url: '127.0.0.1:2333',
    auth: 'youshallnotpass',
    secure: false,
  }
];

export default Nodes;