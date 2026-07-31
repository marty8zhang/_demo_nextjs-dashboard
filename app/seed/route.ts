import bcrypt from 'bcrypt';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import postgres, {TransactionSql} from 'postgres';

async function seedUsers(sql: TransactionSql) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  console.log('Extension `uuid-ossp` created.');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  console.log('Table `users` created.');

  const usersWithHashedPasswords = await Promise.all(
    users.map(async (user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: await bcrypt.hash(user.password, 10),
    }))
  );
  const insertedUsers = await sql`
        INSERT INTO users ${sql(usersWithHashedPasswords, 'id', 'name', 'email', 'password')}
          ON CONFLICT (id) DO NOTHING;
  `;
  console.log('Users added.', insertedUsers);

  return insertedUsers;
}

async function seedInvoices(sql: TransactionSql) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  console.log('Table `invoices` created.');

  const insertedInvoices = await sql`
        INSERT INTO invoices ${sql(invoices, 'customer_id', 'amount', 'status', 'date')}
   ON CONFLICT (id) DO NOTHING;
  `;
  console.log('Invoices added.', insertedInvoices);

  return insertedInvoices;
}

async function seedCustomers(sql: TransactionSql) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  console.log('Table `customers` created.');

  const insertedCustomers = await sql`
        INSERT INTO customers ${sql(customers, 'id', 'name', 'email', 'image_url')}
        ON CONFLICT (id) DO NOTHING;
  `;
  console.log('Customers added.', insertedCustomers);

  return insertedCustomers;
}

async function seedRevenue(sql: TransactionSql) {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  console.log('Table `revenue` created.');

  const insertedRevenue = await sql`
        INSERT INTO revenue ${sql(revenue, 'month', 'revenue')}
        ON CONFLICT (month) DO NOTHING;
  `;
  console.log('Revenue added.', insertedRevenue);

  return insertedRevenue;
}

export async function GET() {
  try {
    const sql = postgres({
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    });

    await sql.begin(async (sql) => {
      await seedUsers(sql);
      await seedCustomers(sql);
      await seedInvoices(sql);
      await seedRevenue(sql);
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.log(error);
    return Response.json({ error }, { status: 500 });
  }
}
