export interface LavalinkNodeConfig {
    name: string;
    url: string;
    auth: string;
    secure: boolean;
    group?: string;   // optional
  }  