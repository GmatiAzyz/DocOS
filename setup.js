#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🚀 DocOS Setup Script');
console.log('=====================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists');
  
  // Validate required environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['NEXTAUTH_SECRET', 'DATABASE_URL'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName) || envContent.includes(`=${varName}`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing required environment variables:', missingVars.join(', '));
    console.log('Please edit .env.local with your actual values');
  } else {
    console.log('✅ Required environment variables are present');
  }
} else {
  console.log('📝 Creating .env.local from template...');
  
  // Read template
  const templatePath = path.join(__dirname, 'env.template');
  if (fs.existsSync(templatePath)) {
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Generate a secure NEXTAUTH_SECRET if not already set
    const nextAuthSecret = crypto.randomBytes(32).toString('hex');
    template = template.replace(
      'NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production',
      `NEXTAUTH_SECRET=${nextAuthSecret}`
    );
    
    fs.writeFileSync(envPath, template);
    console.log('✅ .env.local created from template');
    console.log('✅ Generated secure NEXTAUTH_SECRET');
    console.log('⚠️  Please edit .env.local with your actual DATABASE_URL and other values before continuing');
  } else {
    console.log('❌ env.template not found');
    process.exit(1);
  }
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ Dependencies already installed');
} else {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    console.log('Please run "npm install" manually');
  }
}

// Check if Prisma client exists
const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma');
if (fs.existsSync(prismaClientPath)) {
  console.log('✅ Prisma client already generated');
} else {
  console.log('🔧 Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.log('❌ Failed to generate Prisma client');
    console.log('Please run "npx prisma generate" manually after setting up your database');
  }
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit .env.local with your database and NextAuth configuration');
console.log('2. Set up your PostgreSQL database');
console.log('3. Run "npx prisma db push" to create database tables');
console.log('4. Run "npm run dev" to start the development server');
console.log('\nFor more information, see README.md');
