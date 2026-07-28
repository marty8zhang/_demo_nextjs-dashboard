import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import {formatCurrency} from './utils';
import pg from 'pg';
import process from 'node:process';

const {Client} = pg;
export const client = new Client({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
});
await client.connect();

export async function fetchRevenue() {
  try {
    /* Artificially delay a response for demo purposes. Don't do this in production :) */
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await client.query<Revenue>(`
        SELECT *
        FROM revenue
    `);

    console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.', {cause: error});
  }
}

export async function fetchLatestInvoices() {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    const data = await client.query<LatestInvoiceRaw>(`
        SELECT invoices.amount,
               customers.name,
               customers.image_url,
               customers.email,
               invoices.id
        FROM invoices
                 JOIN customers ON invoices.customer_id = customers.id
        ORDER BY invoices.date DESC LIMIT 5`);

    return data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.', {cause: error});
  }
}

export async function fetchCardData() {
  // await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const result = await client.query(`
        SELECT (SELECT COUNT(*) FROM invoices)                          AS "invoice_count",
               (SELECT COUNT(*) FROM customers)                         AS "customer_count",
               SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)    AS "paid",
               SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
        FROM invoices
    `);

    const numberOfInvoices = Number(result.rows[0].invoice_count ?? '0');
    const numberOfCustomers = Number(result.rows[0].customer_count ?? '0');
    const totalPaidInvoices = formatCurrency(result.rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(result.rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.', {cause: error});
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await client.query<InvoicesTable>(`
        SELECT invoices.id,
               invoices.amount,
               invoices.date,
               invoices.status,
               customers.name,
               customers.email,
               customers.image_url
        FROM invoices
                 JOIN customers ON invoices.customer_id = customers.id
        WHERE customers.name ILIKE '${`%${query}%`}' OR
        customers.email ILIKE '${`%${query}%`}' OR
        invoices.amount::text ILIKE '${`%${query}%`}' OR
        invoices.date::text ILIKE '${`%${query}%`}' OR
        invoices.status ILIKE '${`%${query}%`}'
        ORDER BY invoices.date DESC
            LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
    `);

    return invoices.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.', {cause: error});
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await client.query(`
        SELECT COUNT(1)
        FROM invoices
                 JOIN customers
                      ON invoices.customer_id = customers.id
        WHERE customers.name ILIKE '${`%${query}%`}' OR
      customers.email ILIKE '${`%${query}%`}' OR
      invoices.amount::text ILIKE '${`%${query}%`}' OR
      invoices.date::text ILIKE '${`%${query}%`}' OR
      invoices.status ILIKE '${`%${query}%`}'
    `);

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.', {cause: error});
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await client.query<InvoiceForm>(`
        SELECT invoices.id,
               invoices.customer_id,
               invoices.amount,
               invoices.status
        FROM invoices
        WHERE invoices.id = $1::uuid;
    `, [id]);

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      /* Convert amount from cents to dollars */
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.', {cause: error});
  }
}

export async function fetchCustomers() {
  try {
    const data = await client.query<CustomerField>(`
        SELECT id,
               name
        FROM customers
        ORDER BY name ASC
    `);

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all customers.', {cause: error});
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await client.query<CustomersTableType>(`
        SELECT customers.id,
               customers.name,
               customers.email,
               customers.image_url,
               COUNT(invoices.id)  AS total_invoices,
               SUM(CASE
                       WHEN invoices.status = 'pending' THEN invoices.amount
                       ELSE 0 END) AS total_pending,
               SUM(CASE
                       WHEN invoices.status = 'paid' THEN invoices.amount
                       ELSE 0 END) AS total_paid
        FROM customers
                 LEFT JOIN invoices ON customers.id = invoices.customer_id
        WHERE customers.name ILIKE ${`%${query}%`}
           OR
            customers.email ILIKE ${`%${query}%`}
        GROUP BY customers.id, customers.name, customers.email, customers.image_url
        ORDER BY customers.name ASC
    `);

    return data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer table.', {cause: error});
  }
}
