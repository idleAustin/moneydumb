import { getAuthUserId } from '@/app/lib/auth';
import { sql } from '@/app/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  const userId = await getAuthUserId();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // --- 1. FETCH ACCOUNT DATA ---
    const accountsResult = await sql`
      SELECT 
        a.name, 
        a.balance AS current_balance,
        COALESCE((
          SELECT SUM(e.amount) 
          FROM expenses e 
          WHERE e.account_id = a.id AND e.user_id = ${userId}
        ), 0) AS pending_total
      FROM accounts a
      WHERE a.user_id = ${userId}
      ORDER BY a.name ASC
    `;

    // Format Account Data for Sheet 1
    const bankSheetData = accountsResult.rows.map(b => ({
      'Bank Name': b.name,
      'Total Assets': Number(b.current_balance),
      'Pending Deductions': Number(b.pending_total),
      'Safe To Spend': Number(b.current_balance) - Number(b.pending_total)
    }));

    // --- 2. FETCH EXPENSE DATA ---
    const expensesResult = await sql`
      SELECT 
        e.due_day_of_month,
        e.created_at,
        e.name AS description,
        c.name AS category,
        a.name AS source_bank,
        e.is_recurring,
        e.amount
      FROM expenses e
      LEFT JOIN accounts a ON e.account_id = a.id AND a.user_id = ${userId}
      LEFT JOIN expense_categories c ON e.category_id = c.id AND c.user_id = ${userId}
      WHERE e.user_id = ${userId}
      ORDER BY e.created_at DESC
    `;

    // Format Expense Data for Sheet 2
    const expenseSheetData = expensesResult.rows.map(e => ({
      'Due Date': e.due_day_of_month ? `Day ${e.due_day_of_month}` : (e.created_at ? new Date(e.created_at).toLocaleDateString() : 'N/A'),
      'Description': e.description,
      'Category': e.category || 'Uncategorized',
      'Source Bank': e.source_bank || 'Unassigned',
      'Status': e.is_recurring ? 'RECURRING' : 'ONE-OFF',
      'Amount': Number(e.amount)
    }));

    // --- 3. GENERATE EXCEL FILE ---
    const workbook = XLSX.utils.book_new();

    // Create Sheet 1: Bank Totals
    const ws1 = XLSX.utils.json_to_sheet(bankSheetData);
    // Set column widths for readability
    ws1['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, ws1, "Bank Totals");

    // Create Sheet 2: Expenses
    const ws2 = XLSX.utils.json_to_sheet(expenseSheetData);
    ws2['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, ws2, "All Expenses");

    // Generate Buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // --- 4. CREATE FILENAME ---
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const ts = now.getTime(); // Timestamp
    const filename = `spent_report_${dateStr}_${ts}.xlsx`;

    // --- 5. RETURN RESPONSE ---
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    return new Response('Error generating report', { status: 500 });
  }
}