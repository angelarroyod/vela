// Awaits a Supabase write and returns the error message (or null on success).
export async function mutate<T extends { error: { message: string } | null }>(p: PromiseLike<T>): Promise<string | null> {
  const { error } = await p;
  return error?.message ?? null;
}
