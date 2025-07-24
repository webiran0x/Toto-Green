const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'adminpassword'; // رمز عبوری که میخوای بگذاری
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  console.log(hashed);
}

hashPassword();
