import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function OldCetakModulAjarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id;
  if (id) {
    redirect(`/cetak-modul?id=${id}`);
  }
  redirect('/guru/modul-ajar');
}
