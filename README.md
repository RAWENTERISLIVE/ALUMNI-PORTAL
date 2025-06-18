# 🎓 Alma Connect Sphere

**Professional Alumni Network Platform**

Welcome to Alma Connect Sphere - the premier platform connecting alumni worldwide. A comprehensive networking solution built with modern web technologies for educational institutions and their graduates.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### 🔐 Authentication & Security
- **Secure Login/Registration** with JWT tokens
- **Role-based Access Control** (User/Admin/Super Admin)
- **Admission Number Verification** for authentic alumni
- **Admin Approval Workflow** for new registrations

### 👥 Alumni Directory
- **Advanced Search & Filtering** by name, company, location, skills
- **Professional Profiles** with career information
- **LinkedIn Integration** for enhanced networking
- **Contact Management** with privacy controls

### 💬 Groups & Messaging
- **Public & Private Groups** with secure messaging
- **Real-time Discussions** for community engagement
- **Privacy Controls** - members-only access to private groups
- **Group Discovery** with intelligent recommendations

### 💼 Job Board
- **Job Posting & Browsing** by alumni and recruiters
- **Advanced Filtering** by type, location, salary, company
- **Application Tracking** system
- **Save Jobs** for later review
- **Skills & Salary Tags** for better matching

### 🎯 Mentorship Hub
- **Mentor Profiles** with expertise areas
- **Mentorship Requests** system
- **"Become a Mentor"** application workflow
- **Expertise-based Search** for finding the right mentor

### 📱 Responsive Design
- **Mobile-First Approach** with touch-friendly interfaces
- **Cross-platform Compatibility** (Desktop, Tablet, Mobile)
- **Professional UI/UX** with modern design patterns
- **Accessibility Features** for inclusive usage

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/alma-connect-sphere.git
cd alma-connect-sphere
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
cd ..
```

4. **Environment Setup**
Create `.env` files for both frontend and backend:

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alma_connect
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

5. **Start the application**

**Development Mode (Both Frontend & Backend)**
```bash
npm run dev:full
```

**Or start separately:**

**Frontend**
```bash
npm run dev
```

**Backend**
```bash
cd backend && npm start
```

6. **Access the application**
- Frontend: http://localhost:8082
- Backend API: http://localhost:5000

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

## 🔧 Development

### Available Scripts

**Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend**
```bash
npm start            # Start server
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
```

**Full Application**
```bash
npm run dev:full     # Start both frontend and backend
```

### Code Quality

The project includes:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks (optional)

## 🚀 Deployment

### Build for Production

1. **Build frontend**
```bash
npm run build
```

2. **Build backend**
```bash
cd backend && npm run build
```

### Environment Variables

Set these environment variables for production:

```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# Frontend
VITE_API_URL=https://your-api-domain.com/api
```

### Docker Support (Optional)

```dockerfile
# Dockerfile example for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Write TypeScript with proper types
- Follow the existing code style
- Add appropriate comments
- Test your changes thoroughly
- Update documentation as needed

### Getting Help
- Check the [Documentation](./docs/)
- Review [Issues](https://github.com/your-org/alma-connect-sphere/issues)
- Contact the development team

### Common Issues

**Database Connection Error**
```bash
# Ensure MongoDB is running
mongod --version
```

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
