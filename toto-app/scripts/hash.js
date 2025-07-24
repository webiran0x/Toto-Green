const bcrypt = require('bcrypt');

async function run() {
  const password = 'admin123'; // رمز مورد نظر
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  console.log(hashed);
}

run();
