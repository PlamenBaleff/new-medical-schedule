# Настройка на базата данни (Supabase)

## ⚡ Бързо начало

**Supabase данни са вече конфигурирани в `.env` файл!**

Сега трябва само да:
1. Отидете на [supabase.com](https://supabase.com) и влезте
2. Отворете вашия проект: **bfaheqlcyrukehxodtds**
3. Следвайте стъпките по-долу за създаване на таблици и администратор

## Стъпки за настройка

### 1. Копирайте SQL скриптовете

Отворете файла `supabase-setup.sql` в проекта. Той съдържа всички SQL команди, които са ви нужни.

### 2. Изпълнете SQL скриптовете в Supabase

1. Отидете на [supabase.com](https://supabase.com)
2. Отворете вашия проект **bfaheqlcyrukehxodtds**
3. Отидете на **SQL Editor** (ляво меню)
4. Кликнете **+ New Query**
5. Копирайте содържанието от `supabase-setup.sql`
6. Натиснете **Run** (или Ctrl+Enter)

**Забележка:** Всяко изпълнение на `supabase-setup.sql` ще:
- Създаде таблиците `doctors`, `patients`, `appointments`, `admins`
- Включи Row Level Security (RLS) за защита на данните
- Вмъкне демо лекари (ако не съществуват)
- Даде администраторски права на `ufopjb@abv.bg`

### 3. Създаване на администратор потребител в Supabase Auth

**Това е МНОГО ВАЖНО!**

1. Отидете на **Authentication** → **Users** (ляво меню)
2. Кликнете **Add user** (горен десен ъгъл)
3. Попълнете:
   - **Email:** `ufopjb@abv.bg`
   - **Password:** `850524Plamen1024`
4. Кликнете **Create user**

**Готово!** Администраторът може да влезе в приложението с тези данни и ще има достъп до всички администраторски функции.

### 4. Проверка на успешната настройка

За да проверите дали всичко е в ред:

1. Отворете приложението на [http://localhost:5174](http://localhost:5174)
2. Кликнете **Вход** → въведете:
   - Email: `ufopjb@abv.bg`
   - Парола: `850524Plamen1024`
3. Ако видите **"Администраторски панел"** бутон, всичко работи!

## Таблици в базата данни

### 1. doctors (Лекари)

```sql
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  email TEXT UNIQUE NOT NULL,
  work_hours_from TIME DEFAULT '08:00',
  work_hours_to TIME DEFAULT '17:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Полета:**
- `id` - Уникален идентификатор
- `name` - Име на лекаря
- `specialty` - Специалност (напр. "Кардиолог")
- `email` - Email адрес (уникален)
- `work_hours_from` - Начало на работния ден (по подразбиране 08:00)
- `work_hours_to` - Край на работния ден (по подразбиране 17:00)
- `created_at` - Дата на регистрация

### 2. patients (Пациенти)

```sql
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Полета:**
- `id` - Уникален идентификатор
- `name` - Име на пациента
- `phone` - Телефон
- `email` - Email адрес (уникален)
- `created_at` - Дата на регистрация

### 3. appointments (Записи на часове)

```sql
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  complaints TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);
```

**Полета:**
- `id` - Уникален идентификатор
- `doctor_id` - Референция към лекар
- `patient_id` - Референция към пациент
- `appointment_date` - Дата на преглед
- `appointment_time` - Час на преглед
- `complaints` - Оплаквания на пациента (текст)
- `status` - Статус (scheduled, completed, cancelled)
- `created_at` - Дата на запис

### 4. admins (Администратори)

```sql
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Administrator',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Полета:**
- `id` - Уникален идентификатор
- `email` - Email адрес на администратор (уникален)
- `name` - Име на администратора
- `is_active` - Дали администраторът е активен
- `created_at` - Дата на назначение

## Администраторски функции

След вход като администратор, имате достъп до:

### Управление на лекари
- Преглед на всички регистрирани лекари
- Преглед на техните данни (име, специалност, email, работни часове)
- **Изтриване на лекарски профил**

### Управление на пациенти
- Преглед на всички пациенти
- Преглед на техните данни (име, телефон, email, дата на регистрация)
- **Изтриване на пациентски профил**

### Управление на записи
- Преглед на всички записи на часове
- Преглед на кой пациент е записан при кой лекар
- Преглед на оплакванията на пациентите
- **Изтриване на записи**

## Row Level Security (RLS) Политики

### За doctors таблица:
- ✅ Всички могат да четат списъка с лекари (публичен достъп)
- ✅ Лекарите могат да редактират своя профил
- ✅ Администраторът има пълен достъп

### За patients таблица:
- ✅ Пациентите могат да четат свой профил
- ✅ Пациентите могат да редактират свой профил
- ✅ Администраторът има пълен достъп

### За appointments таблица:
- ✅ Всички могат да четат записи (публичен достъп)
- ✅ Регистрирани потребители могат да правят записи
- ✅ Лекари и пациенти могат да редактират свои записи
- ✅ Администраторът има пълен достъп

### За admins таблица:
- ✅ Администраторите могат да четат администраторски записи
- ✅ Администраторите могат да редактират администраторски записи

## Тестване на приложението

### 1. Регистрирайте се като лекар
- Отворете приложението
- Кликнете "Регистрация като лекар"
- Попълнете данните (име, специалност, работни часове)
- Влезте в системата
- Вашият профил ще се появи в списъка на началната страница

### 2. Регистрирайте се като пациент
- Отворете приложението
- Кликнете "Регистрация като пациент"
- Попълнете данните (име, телефон, email)
- Влезте в системата
- Можете да изберете лекар и да запишете час

### 3. Вход като администратор
- Кликнете "Вход"
- Email: `ufopjb@abv.bg`
- Парола: `850524Plamen1024`
- Ще видите "Администраторски панел" бутон
- Там можете да управлявате всички профили и записи

## Решаване на проблеми

**Проблем:** "Грешка при зареждане на лекари"
- **Решение:** Проверете дали `.env` файлът има правилните Supabase данни
- Опреснете браузъра (F5)

**Проблем:** Не мога да влезна като администратор
- **Решение:** Проверете дали сте създали потребителя в Supabase Auth с email `ufopjb@abv.bg`
- Проверете дали SQL скриптът е изпълнен и е добавил администратора в `admins` таблица

**Проблем:** Администраторът не вижда "Администраторски панел" бутон
- **Решение:** Проверете дали записът в `admins` таблица има `is_active = true`
- Опреснете браузъра
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  complaints TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);
```

### 4. Настройка на Row Level Security (RLS)

#### За таблица doctors:

```sql
-- Разрешаване на публично четене на лекари
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to doctors"
ON doctors FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to insert doctors"
ON doctors FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### За таблица patients:

```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own patient data"
ON patients FOR SELECT
TO authenticated
USING (auth.email() = email);

CREATE POLICY "Allow authenticated users to insert patients"
ON patients FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### За таблица appointments:

```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to appointments"
ON appointments FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to insert appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients WHERE patients.id = appointments.patient_id AND patients.email = auth.email()
  )
  OR
  EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.email = auth.email()
  )
);
```

### 5. Тестови данни (по избор)

```sql
-- Добавяне на тестови лекари
INSERT INTO doctors (name, specialty, email, work_hours_from, work_hours_to) VALUES
('Д-р Иван Петров', 'Кардиолог', 'ivan.petrov@example.com', '09:00', '17:00'),
('Д-р Мария Димитрова', 'Дерматолог', 'maria.dimitrova@example.com', '08:00', '16:00'),
('Д-р Георги Стоянов', 'Хирург', 'georgi.stoyanov@example.com', '10:00', '18:00');
```

## Функционалности на приложението

### 1. Разглеждане на лекари (без регистрация)
- Вляво се показва списък с всички регистрирани лекари
- При избор на лекар се показва календар със свободни и заети часове
- Свободни часове са обозначени в зелено
- Заети часове са обозначени в червено

### 2. Регистрация на лекар
- Име, специалност, email, парола
- Работни часове (от - до)
- След регистрация лекарят се появява автоматично в списъка

### 3. Регистрация на пациент
- Име, телефон, email, парола
- След регистрация пациентът може да записва часове

### 4. Записване на час (само за пациенти)
- Избор на лекар от списъка
- Преглед на календара
- Кликване върху свободен час
- Въвеждане на оплаквания
- Потвърждаване на записа

## Стартиране на приложението

```bash
# Инсталиране на зависимости
npm install

# Стартиране в development режим
npm run dev
```

## Технологии

- **Frontend**: Vanilla JavaScript + Bootstrap 5
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite
