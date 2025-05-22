import { notFound } from 'next/navigation'

interface PostPageProps {
  params: {
    id: string
  }
}

export default function PostPage({ params }: PostPageProps) {
  const { id } = params

  // Здесь можно добавить загрузку данных поста по ID
  // Например, через API или базу данных

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Пост #{id}</h1>
        <div className="pr  ose lg:prose-xl">
          {/* Здесь будет контент поста */}
          <p>Содержимое поста будет загружено здесь</p>
        </div>
      </article>
    </div>
  )
} 