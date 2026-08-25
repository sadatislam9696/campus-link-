// Run with: node scripts/makeAdmin.js someone@example.com
// Promotes an existing user to the "admin" role so they can access
// the /admin panel. Not exposed over HTTP on purpose - granting admin
// rights should never be an API call anyone logged in could reach.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

const run = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/makeAdmin.js <email>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email: ${email}`);
  } else {
    console.log(`✅ ${user.username} (${user.email}) is now an admin.`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
