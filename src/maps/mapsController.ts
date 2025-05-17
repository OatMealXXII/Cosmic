export const loopModeMap = new Map<string, 'off' | 'one' | 'all'>();
export const playerChannelMap = new Map<string, string>();
export const disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();