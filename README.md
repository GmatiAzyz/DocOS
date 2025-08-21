# DocOS - Practice Management System

A comprehensive practice management system for healthcare providers built with Next.js 15, TypeScript, Prisma, and NextAuth.js.

## 🚀 Features

- **User Authentication**: Secure login/registration with NextAuth.js
- **Patient Management**: Add, edit, and manage patient records
- **Appointment Scheduling**: Schedule and manage appointments
- **Visit Notes**: Create and manage patient visit documentation
- **Invoice Management**: Generate and track invoices
- **Guest Mode**: Demo the system without registration
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd docos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy the environment template and fill in your values:
```bash
cp env.template .env.local
```

Edit `.env.local` with your actual values:
```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/docos_db"
```

### 4. Set up the database
```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push

# (Optional) View your data with Prisma Studio
npx prisma studio
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Development

### Using Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Docker
```bash
# Build and run
npm run docker:build
npm run docker:run

# View logs
npm run docker:logs

# Stop container
npm run docker:stop
```

## 🚀 Production Deployment

For production deployment, see [PRODUCTION.md](./PRODUCTION.md) for detailed instructions.

### Quick Production Commands
```bash
# Build production image
docker build -t docos:production .

# Run production container
docker run -d --name docos-production -p 3000:3000 --env-file .env.production docos:production

# Health check
npm run health
```

## 🔧 Configuration

### Database Setup
1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env.local`
3. Run Prisma migrations

### NextAuth.js Configuration
1. Generate a secure secret: `openssl rand -base64 32`
2. Update `NEXTAUTH_SECRET` in your `.env.local`
3. Set `NEXTAUTH_URL` to your application URL

## 📁 Project Structure

```
docos/
├── src/
│   ├── app/                    # Next.js 15 app directory
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/             # Authentication pages
│   │   └── register/          # Registration page
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components
│   │   └── providers/        # Context providers
│   ├── lib/                  # Utility functions
│   └── types/                # TypeScript type definitions
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── tailwind.config.ts        # Tailwind CSS configuration
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
- Verify your PostgreSQL server is running
- Check your `DATABASE_URL` format
- Ensure the database exists and is accessible

#### 2. NextAuth.js Errors
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your app URL
- Ensure all environment variables are loaded

#### 3. Tailwind CSS Not Working
- Verify `tailwind.config.ts` exists
- Check PostCSS configuration
- Ensure CSS imports are correct

#### 4. TypeScript Errors
- Run `npm run build` to check for type errors
- Verify all imports are correct
- Check TypeScript configuration

### Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

## 🔒 Security Considerations

- Change the default `NEXTAUTH_SECRET` in production
- Use environment variables for sensitive configuration
- Implement proper CORS policies for production
- Use HTTPS in production environments
- Regularly update dependencies

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms
- Ensure PostgreSQL is available
- Set all required environment variables
- Configure build commands and output directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include error messages and steps to reproduce

## 🔄 Updates

Stay updated with the latest changes:
- Follow the repository for updates
- Check the changelog
- Review breaking changes in major versions
