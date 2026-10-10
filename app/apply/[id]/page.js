import site from '../../../data/site.json';
import ApplyForm from './form';

export function generateStaticParams() {
  return site.programs.map((p) => ({ id: p.id }));
}

export default function ApplyPage({ params }) {
  return <ApplyForm programId={params.id} />;
}
