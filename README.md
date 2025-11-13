![SFA](https://socialify.git.ci/samyakrajgruhi/SFA/image?custom_description=&description=1&font=KoHo&language=1&name=1&owner=1&pattern=Solid&theme=Dark)

# SFA - Social Fraternity Association Management System

A comprehensive web application for managing a social fraternity association, built with React, TypeScript, Firebase, and modern UI components. The system handles member management, payment tracking, beneficiary requests, and administrative tasks.

> **Note:** The user interface for this application was generated using **[Lovable](https://lovable.dev)**, an AI-powered development platform that creates production-ready React applications with modern UI components.

## 🚀 Features

### Member Management
- **User Authentication**: Secure login system with Firebase Authentication
- **Member Profiles**: Comprehensive user profiles with SFA ID, CMS ID, lobby affiliation, and contact information
- **Role-Based Access**: Multiple user roles (Members, Collection Members, Admins, Founders)
- **Member Directory**: Searchable and filterable member list
- **Registration Control**: Admin-controlled member registration system

### Financial Management
- **Payment Tracking**: Record and track member payments
- **Payment History**: View personal and organization-wide payment records
- **Transaction Management**: Admin tools for managing and deleting transactions
- **Payment Amounts**: Configure payment amounts and collection schedules
- **Revenue Dashboard**: Visual analytics and charts for financial overview

### Beneficiary Support System
- **Request Submission**: Members can submit beneficiary assistance requests
- **Document Upload**: Support for verification documents, pay slips, and application forms
- **Review Workflow**: Admin review and approval process for beneficiary requests
- **Request Tracking**: Track status of submitted beneficiary requests
- **Notification System**: Real-time notifications for request updates

### Lobby Management
- **Lobby System**: Organize members into different lobbies (ANVT, etc.)
- **Lobby Data Tracking**: View statistics and information per lobby
- **Collection Members**: Assign and manage lobby collection members

### Administrative Tools
- **Admin Dashboard**: Centralized admin control panel
- **CSV Import/Export**: Bulk import members and transactions via CSV
- **User Management**: Delete users, assign roles (Founders, Collection Members)
- **Database Cleanup**: Maintenance tools for database management
- **Audit Logs**: Track administrative actions and changes
- **Email Updates**: Cloud function to update user emails with audit trail

### UI/UX Features
- **Modern Design**: Built with Tailwind CSS and Radix UI components
- **Responsive Layout**: Mobile-friendly design
- **Dark Mode Support**: Theme switching capability
- **Loading States**: Skeleton loaders and loading indicators
- **Error Handling**: Comprehensive error boundary and user feedback
- **Toast Notifications**: Real-time user feedback with Sonner
- **Interactive Charts**: Data visualization with Recharts

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router DOM**: Client-side routing
- **TanStack Query**: Data fetching and caching

### UI Components
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Customizable component library
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Recharts**: Chart library for data visualization

### Backend & Services
- **Firebase Authentication**: User authentication
- **Cloud Firestore**: NoSQL database
- **Firebase Storage**: File storage for documents
- **Firebase Functions**: Serverless cloud functions (Node.js)
- **Firebase Hosting**: Production hosting

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Form validation integration

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun
- Firebase account and project

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/samyakrajgruhi/SFA.git
cd SFA
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Firebase Functions dependencies**
```bash
cd functions
npm install
cd ..
```

### Development

**Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

**Run Firebase Functions locally:**
```bash
npm run functions:serve
```

### Building for Production

**Build the frontend:**
```bash
npm run build
```

**Build Firebase Functions:**
```bash
npm run functions:build
```

### Deployment

**Deploy to Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**Deploy Cloud Functions:**
```bash
npm run functions:deploy
```

**Deploy everything:**
```bash
firebase deploy
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run functions:build` | Build Firebase Functions |
| `npm run functions:serve` | Run Functions emulator |
| `npm run functions:deploy` | Deploy Functions to Firebase |
| `npm run functions:logs` | View Function logs |

## 🔐 User Roles & Permissions

### Member (Default)
- View personal profile
- Submit payment records
- Request beneficiary assistance
- View announcements

### Collection Member
- All member permissions
- Collect payments from lobby members
- View lobby-specific data

### Admin
- All collection member permissions
- Manage members and transactions
- Review beneficiary requests
- Access admin dashboard
- Import/export data via CSV
- Delete users and transactions

### Founder
- All admin permissions
- Update user emails (via Cloud Functions)
- Assign founder status to others
- Access to all system features
- View audit logs

## 🗄️ Database Structure

### Collections

#### `users`
- User profile information
- Indexed by `uid` field

#### `users_by_uid`
- User data indexed by UID (document ID)
- Contains authentication and profile data

#### `beneficiary_requests`
- Beneficiary assistance requests
- Document uploads and status tracking
- Approval workflow data

#### `transactions`
- Payment records
- Member payment history

#### `audit_logs`
- System action logs
- Administrative changes tracking

#### `announcements`
- Organization-wide announcements
- Notification system

## 🎨 UI Components

The project uses **shadcn/ui** components built on **Radix UI** primitives:

- Accordion, Alert Dialog, Avatar
- Button, Card, Checkbox
- Dialog, Drawer, Dropdown Menu
- Form, Input, Select
- Table, Tabs, Toast
- And many more...

All components are fully customizable and theme-aware.

## 🔧 Configuration Files

- **`vite.config.ts`**: Vite bundler configuration
- **`tailwind.config.ts`**: Tailwind CSS theme configuration
- **`tsconfig.json`**: TypeScript compiler options
- **`firebase.json`**: Firebase project configuration
- **`eslint.config.js`**: ESLint rules
- **`components.json`**: shadcn/ui component configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 👥 Authors

- **Samyak Rajgruhi** - *Developer* - [@samyakrajgruhi](https://github.com/samyakrajgruhi)

## 🐛 Known Issues

- Build currently requires TypeScript check (`tsc -b`) - may have type errors to resolve
- Some environment-specific configurations may need adjustment

## 📞 Support

For support, please contact the project administrator or create an issue in the repository.
---

**Built with ❤️ for Social Fraternity Association**
