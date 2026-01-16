# Medical Schedule Application

A multi-page JavaScript application for managing doctor schedules, staff, and appointments using Vite, Bootstrap, and Supabase.

## Project Structure

```
src/
├── pages/           # Page components (home, schedule, doctors, settings)
├── components/      # Reusable UI components
├── services/        # Business logic (auth, router, supabase client)
├── utils/           # Utility functions
├── styles/          # CSS stylesheets
└── assets/          # Images, icons, and other assets
```

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **UI Framework**: Bootstrap 5
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Package Manager**: npm
- **Node.js**: v16+ required

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your Supabase URL and Anonymous Key
3. Create a `.env` file based on `.env.example`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Features

- **Multi-page Navigation**: Hash-based routing with separate page components
- **Responsive Design**: Mobile-friendly layout with Bootstrap
- **Modular Architecture**: Separated concerns (pages, services, components)
- **Supabase Integration**: Ready for database and authentication setup
- **Doctor Management**: View and manage medical staff
- **Schedule Management**: Display and manage doctor schedules
- **Settings Page**: Configure Supabase credentials

## Navigation

- **Home** (`#home`) - Welcome page with quick links
- **Schedule** (`#schedule`) - Doctor schedule management
- **Doctors** (`#doctors`) - Medical staff directory
- **Settings** (`#settings`) - Application configuration

## Future Development

- [ ] Implement Supabase database tables (doctors, schedules, appointments)
- [ ] Add user authentication (login/register)
- [ ] Create appointment booking system
- [ ] Add form validation and error handling
- [ ] Implement data persistence to Supabase
- [ ] Add notification system
- [ ] Create admin dashboard
- [ ] Add print/export functionality

## Contributing

This project is set up for AI-assisted development. Feel free to extend and customize as needed.

## License

MIT
