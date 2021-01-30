import supertest from 'supertest';

declare module 'supertest-session' {
  declare function supertest(app: any): supertest.SuperTest<supertest.Test>;
  export = supertest;
}
