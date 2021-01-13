// https://github.com/gtramontina/passport-stub#readme
import { Express } from 'express';

declare module 'passport-stub' {
  declare function install(app: Express): void;
  declare function uninstall(): void;
  declare function login(user: unknown): void;
  declare function logout(): void;
}
