// Integration tests must opt into a disposable database explicitly.
// Never use a developer or production DATABASE_URL from the environment.
if (process.env.TEST_DATABASE_URL)
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
else delete process.env.DATABASE_URL;
