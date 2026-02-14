// backend/scripts/createAdmin.js
const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    // Password will be hashed automatically by the User model's pre-save hook
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed automatically
      name: 'Admin User',
      role: 'admin',
    });

    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║         Admin User Created Successfully!          ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📧 Email:    admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role:     admin');
    console.log('🆔 User ID:  ' + admin._id);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password in production!');
    console.log('');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
createAdmin();