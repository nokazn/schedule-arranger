import { Profile } from 'passport';

declare global {
  namespace Express {
    type ExtendedProfile = Profile & { provider: 'github' };
    interface User extends ExtendedProfile {}
  }
}

declare module 'express-serve-static-core' {
  export interface Response {
    render<Options extends object>(
      view: string,
      options?: Options,
      callback?: (err: Error, html: string) => void,
    ): void;
  }
}
