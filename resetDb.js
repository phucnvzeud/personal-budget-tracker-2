const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dedfinance';

async function resetDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('Connected to MongoDB. Clearing collections...');

    // Define the schemas - simplified versions just for deletion
    const UserSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String
    });
    
    const FinancialEntrySchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      date: Date,
      amount: Number,
      description: String,
      type: String
    });
    
    const RecurringPaymentSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      description: String,
      amount: Number,
      type: String
    });
    
    // Create models
    const User = mongoose.model('User', UserSchema);
    const FinancialEntry = mongoose.model('FinancialEntry', FinancialEntrySchema);
    const RecurringPayment = mongoose.model('RecurringPayment', RecurringPaymentSchema);
    
    // Delete all documents from each collection
    await User.deleteMany({});
    console.log('Users deleted');
    
    await FinancialEntry.deleteMany({});
    console.log('Financial entries deleted');
    
    await RecurringPayment.deleteMany({});
    console.log('Recurring payments deleted');
    
    console.log('Database reset successful!');
  } catch (error) {
    console.error('Database reset failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the reset function
resetDatabase(); 