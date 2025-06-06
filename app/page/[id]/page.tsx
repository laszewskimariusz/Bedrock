import PageEditor from '../../../components/page-editor'

export default function Page({ params }: { params: { id: string } }) {
  return <PageEditor pageId={params.id} />
} 