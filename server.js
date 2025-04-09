const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
// Force PORT to be a number
const PORT = parseInt(process.env.PORT || "8080", 10);
const JWT_SECRET = process.env.JWT_SECRET || 'budget-tracker-secret-key';

// Debug environment variables
console.log('Environment variables:', { 
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? '[REDACTED]' : undefined
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dedfinance';
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  socketTimeoutMS: 45000 // 45 seconds timeout
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Connection string used (without credentials):', 
      MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://***:***@'));
  });

// MongoDB Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const FinancialEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
});

const RecurringPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  scheduleType: { type: String, required: true },
  frequency: { type: String, required: true },
  dayOfMonth: { type: Number },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date },
  isActive: { type: Boolean, required: true, default: true }
});

const User = mongoose.model('User', UserSchema);
const FinancialEntry = mongoose.model('FinancialEntry', FinancialEntrySchema);
const RecurringPayment = mongoose.model('RecurringPayment', RecurringPaymentSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await newUser.save();
    
    // Generate token
    const token = jwt.sign({ id: newUser._id, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Financial Entry routes
app.get('/api/entries', authenticateToken, async (req, res) => {
  try {
    const entries = await FinancialEntry.find({ userId: req.user.id });
    res.json(entries);
  } catch (error) {
    console.error('Error getting entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/entries', authenticateToken, async (req, res) => {
  try {
    const { date, amount, description, type } = req.body;
    
    const newEntry = new FinancialEntry({
      userId: req.user.id,
      date: new Date(date),
      amount,
      description,
      type
    });
    
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/entries/:id', authenticateToken, async (req, res) => {
  try {
    const { date, amount, description, type } = req.body;
    
    const entry = await FinancialEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    entry.date = new Date(date);
    entry.amount = amount;
    entry.description = description;
    entry.type = type;
    
    await entry.save();
    res.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await FinancialEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    await entry.deleteOne();
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Recurring Payment routes
app.get('/api/recurring-payments', authenticateToken, async (req, res) => {
  try {
    const payments = await RecurringPayment.find({ userId: req.user.id });
    res.json(payments);
  } catch (error) {
    console.error('Error getting recurring payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/recurring-payments', authenticateToken, async (req, res) => {
  try {
    const payment = new RecurringPayment({
      userId: req.user.id,
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      validFrom: new Date(req.body.validFrom),
      validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined
    });
    
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating recurring payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/recurring-payments/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await RecurringPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'startDate' || key === 'endDate' || key === 'validFrom' || key === 'validUntil') {
        payment[key] = req.body[key] ? new Date(req.body[key]) : undefined;
      } else {
        payment[key] = req.body[key];
      }
    });
    
    await payment.save();
    res.json(payment);
  } catch (error) {
    console.error('Error updating recurring payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/recurring-payments/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await RecurringPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    await payment.deleteOne();
    res.json({ message: 'Recurring payment deleted' });
  } catch (error) {
    console.error('Error deleting recurring payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 