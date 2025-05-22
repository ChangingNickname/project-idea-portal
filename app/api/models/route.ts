import { db, auth } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface Model {
  id: string;
  name: string;
  description: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  status: 'Draft' | 'Published' | 'Archived';
  tags: string[];
  content: string;
  image?: string;
}

interface CreateModelData {
  name: string;
  description: string;
  content: string;
  tags: string[];
  image?: string;
}

interface ModelResponse {
  success: boolean;
  data?: Model | Model[];
  error?: string;
}

export async function GET(request: Request) {
  try {
    console.log('🔐 Getting session cookie...');
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json<ModelResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = await auth.verifySessionCookie(session);
    console.log('✅ Session verified for UID:', decoded.uid);

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const me = searchParams.get('me');
    const authorId = searchParams.get('authorId');

    let query = db.collection('models');

    // Если указан флаг me или authorId, фильтруем по authorId
    if (me === 'true' || authorId) {
      const filterId = me === 'true' ? decoded.uid : authorId;
      query = query.where('authorId', '==', filterId);
    }

    const snapshot = await query.get();
    const models = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Model[];

    return NextResponse.json<ModelResponse>({
      success: true,
      data: models
    });
  } catch (e) {
    console.error('❌ Error in GET /api/models:', e);
    return NextResponse.json<ModelResponse>({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔐 Getting session cookie...');
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json<ModelResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = await auth.verifySessionCookie(session);
    console.log('✅ Session verified for UID:', decoded.uid);

    const body = await request.json() as CreateModelData;
    const { name, description, content, tags, image } = body;

    if (!name || !description || !content || !tags) {
      return NextResponse.json<ModelResponse>({
        success: false,
        error: 'Name, description, content and tags are required'
      }, { status: 400 });
    }

    const modelData: Omit<Model, 'id'> = {
      name,
      description,
      content,
      tags,
      authorId: decoded.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Draft',
      ...(image && { image })
    };

    const modelRef = await db.collection('models').add(modelData);
    const newModel: Model = {
      id: modelRef.id,
      ...modelData
    };

    return NextResponse.json<ModelResponse>({
      success: true,
      data: newModel
    });
  } catch (e) {
    console.error('❌ Error in POST /api/models:', e);
    return NextResponse.json<ModelResponse>({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 });
  }
} 