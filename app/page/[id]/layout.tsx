import Sidebar from '../../../components/sidebar'

export default function PageEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-white">
        {children}
      </main>
    </div>
  )
} 