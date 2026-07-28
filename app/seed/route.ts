import bcrypt from 'bcrypt';
import pg from 'pg';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import * as process from 'node:process';

const { Client } = pg;
const client = new Client({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
});
await client.connect();

async function seedUsers() {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  console.log('Extension `uuid-ossp` created.');
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);
  console.log('Table `users` created.');

  const values: string[] = [];
  const params: unknown[] = [];
  for (const [i, user] of users.entries()) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const offset = i * 4;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
    params.push(user.id, user.name, user.email, hashedPassword);
  }
  const insertedUsers = await client.query(`
        INSERT INTO users (id, name, email, password)
        VALUES ${values.join(',')}
        ON CONFLICT (id) DO NOTHING;
      `,
    params);
  console.log('Users added.', insertedUsers);

  return insertedUsers;
}

async function seedInvoices() {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `);
  console.log('Table `invoices` created.');

  const values: string[] = [];
  const params: unknown[] = [];
  for (const [i, invoice] of invoices.entries()) {
    const offset = i * 4;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
    params.push(invoice.customer_id, invoice.amount, invoice.status, invoice.date);
  }
  const insertedInvoices = await client.query(
    `INSERT INTO invoices (customer_id, amount, status, date)
   VALUES ${values.join(', ')}
   ON CONFLICT (id) DO NOTHING;`,
    params,
  );
  console.log('Invoices added.', insertedInvoices);

  return insertedInvoices;
}

async function seedCustomers() {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `);
  console.log('Table `customers` created.');

  const values: string[] = [];
  const params: unknown[] = [];
  customers.forEach((customer, i) => {
    const offset = i * 4;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
    params.push(customer.id, customer.name, customer.email, customer.image_url);
  });
  const insertedCustomers = await client.query(
    `INSERT INTO customers (id, name, email, image_url)
   VALUES ${values.join(', ')}
   ON CONFLICT (id) DO NOTHING;`,
    params,
  );
  console.log('Customers added.', insertedCustomers);

  return insertedCustomers;
}

async function seedRevenue() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `);
  console.log('Table `revenue` created.');

  const values: string[] = [];
  const params: unknown[] = [];
  for (const [i, rev] of revenue.entries()) {
    const offset = i * 2;
    values.push(`($${offset + 1}, $${offset + 2})`);
    params.push(rev.month, rev.revenue);
  }
  const insertedRevenue = await client.query(
    `INSERT INTO revenue (month, revenue)
   VALUES ${values.join(', ')}
   ON CONFLICT (month) DO NOTHING;`,
    params,
  );
  console.log('Revenue added.', insertedRevenue);

  return insertedRevenue;
}

export async function GET() {
  try {
    await client.query(`BEGIN`);
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    await client.query(`COMMIT`);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.query(`ROLLBACK`);
    return Response.json({ error }, { status: 500 });
  }
}
