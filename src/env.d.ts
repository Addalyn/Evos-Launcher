declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      APP_EDITION: 'full' | 'lite';
    }
  }
}

export {};
