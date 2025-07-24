const bcrypt = require('bcryptjs');

const hashed = '$2a$10$MVTjg3sqVy72wD8iE0dOO.7wHA/uzn.vY7.LNHotV5mhf98TsIMPW'; // رمز هش شده موجود در DB
const password = '123456';

bcrypt.compare(password, hashed).then(match => {
  console.log('Password matches:', match);
});
