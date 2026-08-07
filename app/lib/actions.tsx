'use server';

import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {signIn} from '@/auth';
import { AuthError } from 'next-auth';
import postgres from 'postgres';

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const sql = postgres({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.NODE_ENV === 'production' ? 'prefer' : false,
});

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, {message: 'Please enter an amount greater than $0.'}),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const InvoiceCreateSchema = InvoiceSchema.omit({id: true, date: true});

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = InvoiceCreateSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const {customerId, amount, status} = validatedFields.data;
  const amountInCents = amount * 100;

  await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${new Date().toISOString().split('T')[0]})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const InvoiceUpdateSchema = InvoiceSchema.omit({id: true, date: true});

export async function updateInvoice(id: string, formData: FormData) {
  const {customerId, amount, status} = InvoiceUpdateSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount      = ${amountInCents},
          status      = ${status}
      WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('Boom!!!');

  await sql`
    DELETE
    FROM invoices
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid login credentials.';
        default:
          return 'Something went wrong during authentication.';
      }
    }
    throw error;
  }
}
