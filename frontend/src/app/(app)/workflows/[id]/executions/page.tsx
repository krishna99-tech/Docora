import { redirect } from 'next/navigation';

export default async function WorkflowExecutionsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/workflows/${id}`);
}
