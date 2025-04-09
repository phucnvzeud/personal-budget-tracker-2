const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dedfinance';

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('Connected to MongoDB. Creating test user schema...');

    // Define user schema
    const UserSchema = new mongoose.Schema({
      username: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
    });
    
    // Create model
    const User = mongoose.model('User', UserSchema);
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test user data
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    };
    
    // First delete any existing test user
    await User.deleteOne({ email: testUser.email });
    console.log('Deleted any existing test user');
    
    // Create new test user
    const newUser = new User(testUser);
    await newUser.save();
    
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Failed to create test user:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
createTestUser(); 