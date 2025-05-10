import type { LavalinkNodeConfig } from '../types/LavalinkNode.ts'

const Nodes: LavalinkNodeConfig[] = [
  {
    name: 'Localhost',
    url: 'localhost:2333',
    auth: 'youshallnotpass',
    secure: false
  }
];

export default Nodes;
