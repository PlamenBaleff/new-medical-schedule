# Medical Schedule Application

Система за записване на часове при лекари с Bootstrap и Supabase. Приложението позволява на потребителите да разглеждат графици на лекари, да се регистрират като лекари или пациенти, и да записват часове.

## Функционалности

### 1. Публични функции (без регистрация)
- ✅ Преглед на списък с всички регистрирани лекари
- ✅ Избор на лекар и преглед на неговия график
- ✅ Календар показващ свободни и заети часове за всеки лекар

### 2. Регистрация и вход
- ✅ Регистрация като лекар (име, специалност, email, парола, работни часове)
- ✅ Регистрация като пациент (име, телефон, email, парола)
- ✅ Вход в системата за регистрирани потребители

### 3. Функции за лекари
- ✅ Автоматично добавяне в списъка след регистрация
- ✅ Задаване на работни часове
- ✅ Преглед на собствения график и записани пациенти

### 4. Функции за пациенти
- ✅ Преглед на графици на всички лекари
- ✅ Избор на лекар и свободен час
- ✅ Записване на час с описание на оплакванията
- ✅ Преглед на собствените записани часове

## Структура на проекта

```
src/
├── pages/           # Страници (home, schedule, doctors, settings)
├── components/      # Преизползваеми UI компоненти
├── services/        # Бизнес логика (auth, router, supabase)
├── utils/           # Помощни функции
├── styles/          # CSS стилове
└── assets/          # Изображения и ресурси
```

## Технологии

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **UI Framework**: Bootstrap 5
- **Backend**: Supabase (PostgreSQL, Authentication)
- **Package Manager**: npm
- **Node.js**: v16+

## Инструкции за настройка

### 1. Инсталиране на зависимости

```bash
npm install
```

### 2. Конфигуриране на Supabase

1. Създайте проект на [supabase.com](https://supabase.com)
2. Копирайте вашия Supabase URL и Anonymous Key
3. Създайте `.env` файл базиран на `.env.example`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Настройка на базата данни

Вижте подробни инструкции в [DATABASE_SETUP.md](DATABASE_SETUP.md) за:
- SQL скриптове за създаване на таблици
- Row Level Security (RLS) политики
- Тестови данни

### 4. Стартиране на development сървър

```bash
npm run dev
```

## База данни схема

### Таблица: doctors
- `id` - UUID (primary key)
- `name` - Име на лекаря
- `specialty` - Специалност
- `email` - Email (unique)
- `work_hours_from` - Начало на работния ден
- `work_hours_to` - Край на работния ден

### Таблица: patients
- `id` - UUID (primary key)
- `name` - Име на пациента
- `phone` - Телефон
- `email` - Email (unique)

### Таблица: appointments
- `id` - UUID (primary key)
- `doctor_id` - Референция към лекар
- `patient_id` - Референция към пациент
- `appointment_date` - Дата на прегледа
- `appointment_time` - Час на прегледа
- `complaints` - Оплаквания на пациента
- `status` - Статус (scheduled, completed, cancelled)

## Как да използвате приложението

### За посетители (без регистрация):
1. Отворете началната страница
2. Вляво ще видите списък с лекари
3. Кликнете на лекар за да видите неговия график
4. Календарът показва свободни (зелени) и заети (червени) часове

### За регистрация като лекар:
1. Натиснете "Регистрация като лекар"
2. Попълнете формата с вашите данни
3. Задайте работни часове
4. След регистрация ще се появите в списъка с лекари

### За регистрация като пациент:
1. Натиснете "Регистрация като пациент"
2. Попълнете формата с вашите данни
3. След вход можете да записвате часове

### За записване на час (като пациент):
1. Влезте в системата
2. Изберете лекар от списъка
3. Прегледайте календара
4. Кликнете на свободен час (зелен)
5. Опишете оплакванията си
6. Потвърдете записа

## Build за production

```bash
npm run build
```

Файловете ще бъдат генерирани в `dist/` директорията.

## Deploy в Netlify

Проектът е Vite SPA (History API routing), и вече има Netlify настройки в `netlify.toml` + `public/_redirects`.

1. Качете проекта в Git (GitHub/GitLab).
2. Netlify → **Add new site** → **Import from Git**.
3. Build settings (ако не се попълнят автоматично):
	- **Build command:** `npm run build`
	- **Publish directory:** `dist`
4. Netlify → **Site settings → Environment variables** добавете (преди deploy / или направете redeploy след добавяне):
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`

Забележка: Vite “вгражда” env променливите по време на build, т.е. промени в env изискват нов deploy.

Ако използвате email confirmation при регистрация: в Supabase → Authentication settings добавете Netlify домейна ви като Site URL/Redirect URL (за да може линкът от имейла да връща към сайта).

## Превю на production build

```bash
npm run preview
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
