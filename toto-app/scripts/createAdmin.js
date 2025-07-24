const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  await connectDB();

  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminUser = new User({
    username: 'admin',
    password: hashedPassword,
    role: 'admin',
  });

  await adminUser.save();
  console.log('✅ Admin user created successfully');
  process.exit();
};

createAdmin();
