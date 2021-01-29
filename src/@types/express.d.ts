import type { Request } from 'express';
import type { Profile } from 'passport';

declare global {
  namespace Express {
    interface User extends Profile {}
  }
}

declare module 'express-serve-static-core' {
  export interface Request extends Request {
    cookies: {
      loginFrom?: string;
      _csrf?: string;
    };
  }
  export interface Response {
    render<Options extends object>(
      view: string,
      options?: Options,
      callback?: (err: Error, html: string) => void,
    ): void;
  }
}
