import { getAuthUserId } from '@/app/lib/auth';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not Found' }, { status: 404 });
  }

  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({ 
    success: true, 
    message: 'Shutdown command simulated successfully. (Connection safely paused)' 
  });
}
