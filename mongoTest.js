const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dedfinance';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('Connected to MongoDB successfully!');
    
    // Check if test user exists
    console.log('Checking if test user exists...');
    const UserSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String
    });
    
    const User = mongoose.model('User', UserSchema);
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (testUser) {
      console.log('Test user found:', {
        id: testUser._id,
        username: testUser.username,
        email: testUser.email
      });
    } else {
      console.log('Test user not found. Creating test user...');
      
      // Create test user with password hashing
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      await newUser.save();
      console.log('Test user created successfully!');
    }
    
    // Count total users
    const userCount = await User.countDocuments({});
    console.log(`Total users in database: ${userCount}`);
    
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the test
testConnection(); 