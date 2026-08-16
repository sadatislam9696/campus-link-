// Runs before every test file. Keeps tests independent of whatever is
// (or isn't) in a local .env, and guarantees JWT_SECRET always exists so
// token signing in controllers doesn't blow up mid-test.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
process.env.NODE_ENV = "test";
