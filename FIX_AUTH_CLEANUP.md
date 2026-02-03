# Поправка: Изтриване на потребители с автентикация

## Проблем
Когато администратор изтриваше профили на лекари и пациенти, те се премахваха само от таблиците `doctors` и `patients`, но **НЕ** от Supabase Authentication системата. Това води до проблем при опит за повторна регистрация със същия email - системата съобщава, че потребителят вече съществува.

## Причина
Supabase използва две отделни системи:
1. **Authentication (Auth)** - управлява потребителски акаунти, пароли и сесии
2. **Database (Tables)** - съхранява профилни данни (doctors, patients, etc.)

Когато се изтрива само от таблицата, auth акаунтът остава активен.

## Решение

### 1. Обновени функции за изтриване

#### `deleteDoctor()` - [home.js](src/pages/home.js#L1003-L1035)
```javascript
window.deleteDoctor = async (doctorId) => {
  // 1. Взема email на лекаря
  const { data: doctor } = await supabase
    .from('doctors')
    .select('email')
    .eq('id', doctorId)
    .single()
  
  // 2. Изтрива от doctors таблица
  await supabase.from('doctors').delete().eq('id', doctorId)
  
  // 3. Изтрива и от auth системата
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === doctor.email)
  if (authUser) {
    await supabase.auth.admin.deleteUser(authUser.id)
  }
}
```

#### `deletePatient()` - [home.js](src/pages/home.js#L1051-L1083)
Аналогична логика за пациенти.

### 2. Нова функция за почистване

#### `cleanOrphanedAuthUsers()` - [home.js](src/pages/home.js#L1103-L1135)
Намира и изтрива **осиротели** auth акаунти (тези, които нямат съответен профил в системата):

```javascript
window.cleanOrphanedAuthUsers = async () => {
  // 1. Взема всички auth потребители
  const { data: { users } } = await supabase.auth.admin.listUsers()
  
  // 2. Взема всички валидни emails от doctors, patients, admins
  const validEmails = new Set([...doctors, ...patients, ...admins].map(p => p.email))
  
  // 3. Изтрива auth акаунти без профил
  for (const user of users) {
    if (!validEmails.has(user.email)) {
      await supabase.auth.admin.deleteUser(user.id)
    }
  }
}
```

### 3. Добавен бутон в Admin панела

В администраторския интерфейс е добавен бутон **"Изчисти осиротели акаунти"**, който стартира `cleanOrphanedAuthUsers()`.

## Използване

### За текущи проблеми:
1. Влезте като администратор
2. Отворете Admin панела
3. Натиснете бутона **"Изчисти осиротели акаунти"**
4. Това ще премахне всички auth записи без профили
5. Вече можете да се регистрирате отново със същите emails

### За бъдещи изтривания:
Просто използвайте бутоните "Изтрий" в Admin панела - те автоматично изтриват и от auth системата.

## Технически детайли

### Необходими права:
- Функциите използват `supabase.auth.admin.*` API
- Изискват администраторски ключ (service role key)
- Проверете настройките на Supabase проекта

### Обработка на грешки:
- Ако auth изтриването не успее, системата показва предупреждение в конзолата
- Профилът в базата данни се изтрива независимо от auth статуса
- Възможно е auth изтриването да изисква допълнителни права

## Важно
⚠️ Изтриването на auth акаунт е **необратимо** действие. Потребителят ще трябва да се регистрира отново, ако иска да използва системата.
