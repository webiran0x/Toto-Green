const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/yourdbname')
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    mongoose.connection.close(); // اتصال رو ببند
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
