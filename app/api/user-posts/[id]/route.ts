import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Получаем посты пользователя из Firestore
    const postsRef = db.collection('posts');
    const q = postsRef
      .where('authorId', '==', id)
      .orderBy('createdAt', 'desc');
    
    try {
      const querySnapshot = await q.get();
      
      if (querySnapshot.empty) {
        return NextResponse.json([]);
      }

      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json(posts);
    } catch (error: any) {
      // Если ошибка связана с отсутствием индекса
      if (error.code === 9) { // 9 - это код ошибки для отсутствующего индекса
        return NextResponse.json(
          { 
            error: 'Index not found',
            message: 'Please create a composite index for posts collection with fields: authorId (ASCENDING) and createdAt (DESCENDING)',
            link: 'https://console.firebase.google.com/project/_/firestore/indexes'
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error fetching user posts:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 