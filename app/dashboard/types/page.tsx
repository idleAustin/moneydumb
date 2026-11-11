import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Tags,
  Tag,
  ArrowLeft,
  Trash2,
  Folder,
} from 'lucide-react';
import { getAuthUserId } from '@/app/lib/auth';
import {
  getExpenseTypes,
  createExpenseType,
  deleteExpenseType,
  type ExpenseType,
} from '@/app/lib/actions';

export default async function ManageExpenseCategories() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect('/');
  }

  const types = await getExpenseTypes();

  async function addTypeAction(formData: FormData) {
    'use server';
    await createExpenseType(formData);
    redirect('/dashboard/types');
  }

  async function deleteTypeAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteExpenseType(id);
    redirect('/dashboard/types');
  }

  return (
    <div className="fade-in">
      <div
        className="page-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            <Tags
              size={20}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 8, color: 'var(--as-accent-primary)' }}
            />
            <span>Expense Categories</span>
          </h2>
          <p>Organize recurring bills, one-off expenses, and monthly budget envelopes by category.</p>
        </div>

        <Link
          href="/dashboard/expenses"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          <span>Back to Expenses</span>
        </Link>
      </div>

      <div className="card section">
        <div className="card-header">
          <h3>Add Expense Category</h3>
        </div>
        <form action={addTypeAction}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'flex-end',
            }}
          >
            <div className="form-group" style={{ flex: '1 1 260px', marginBottom: 0 }}>
              <label htmlFor="category-name">Category Name</label>
              <input
                id="category-name"
                name="name"
                type="text"
                required
                placeholder="e.g. Housing, Groceries, Utilities"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              + Add Category
            </button>
          </div>
        </form>
      </div>

      <div className="card section">
        <div className="card-header">
          <h3>Active Categories</h3>
          <span
            className="badge badge-blue"
            style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
          >
            {types.length} {types.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {types.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Folder
                size={32}
                strokeWidth={2.0}
                aria-hidden="true"
                focusable="false"
                style={{ color: 'var(--as-accent-primary)' }}
              />
            </div>
            <h3>No expense categories defined</h3>
            <p>Add categories above to classify recurring bills and monthly spending.</p>
          </div>
        ) : (
          <div className="scroll-table-wrapper">
            <div className="scroll-table-inner">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col" style={{ width: 96, textAlign: 'right' }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((type: ExpenseType) => (
                    <tr key={type.id}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Tag
                            size={15}
                            strokeWidth={2.0}
                            aria-hidden="true"
                            focusable="false"
                            style={{ color: 'var(--as-text-secondary)', flexShrink: 0 }}
                          />
                          <span>{type.name}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <form action={deleteTypeAction} style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={type.id} />
                          <button
                            type="submit"
                            className="btn btn-danger btn-small"
                            aria-label={`Delete category ${type.name}`}
                          >
                            <Trash2
                              size={14}
                              strokeWidth={2.0}
                              aria-hidden="true"
                              focusable="false"
                            />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
