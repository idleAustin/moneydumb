import { getExpenseTypes, createExpenseType, deleteExpenseType, type ExpenseType } from '../../lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default async function ManageTypes() {
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
    <div className="min-h-screen bg-retro-black text-retro-green font-mono p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-retro-dim pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter">EXPENSE_VARIABLES</h1>
          <p className="text-xs text-retro-dim mt-1">&gt;&gt; CONFIG / CATEGORIES</p>
        </div>
        <Link
          href="/dashboard/this-month"
          className="text-xs border border-retro-dim px-4 py-2 hover:bg-retro-dim hover:text-retro-black transition-colors uppercase inline-flex items-center gap-1"
          aria-label="Return to this month workspace"
        >
          <ArrowLeft size={12} aria-hidden="true" focusable="false" /> Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Add Form */}
        <div className="lg:col-span-1 border border-retro-dim bg-retro-gray/5 p-6 h-fit">
          <h2 className="text-xl font-bold mb-6 border-b border-retro-dim pb-2">DEFINE_VARIABLE</h2>
          <form action={addTypeAction} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-retro-dim">Category Name</label>
              <input name="name" type="text" required className="w-full bg-transparent border-b border-retro-green p-2 focus:outline-none focus:border-retro-amber" placeholder="MORTGAGE / FOOD" />
            </div>
            <button
              type="submit"
              className="w-full bg-retro-green text-retro-black font-bold py-3 hover:bg-retro-dim hover:text-retro-green transition-colors uppercase tracking-widest cursor-pointer"
              aria-label="Add expense variable"
            >
              ADD VARIABLE
            </button>
          </form>
        </div>

        {/* Right Col: List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 border-b border-retro-dim pb-2">ACTIVE_VARIABLES [{types.length}]</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types.map((type: ExpenseType) => (
              <div key={type.id} className="border border-retro-dim p-4 flex justify-between items-center hover:bg-retro-gray/10 transition-colors">
                <span className="font-bold text-sm"># {type.name}</span>
                <form action={deleteTypeAction}>
                  <input type="hidden" name="id" value={type.id} />
                  <button
                    type="submit"
                    className="text-xs text-retro-red hover:underline decoration-retro-red underline-offset-4 cursor-pointer inline-flex items-center gap-1"
                    aria-label={`Delete expense variable ${type.name}`}
                  >
                    <Trash2 size={12} aria-hidden="true" focusable="false" /> DEL
                  </button>
                </form>
              </div>
            ))}
            
            {types.length === 0 && (
              <div className="col-span-2 p-8 text-center text-retro-dim italic border border-retro-dim border-dashed">
                NO VARIABLES DEFINED.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}