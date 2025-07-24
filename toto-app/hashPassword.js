// hashPassword.js
const bcrypt = require('bcrypt');
const password = 'yourplaintextpassword';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) return console.error(err);
  console.log('Hashed password:', hash);
});
