

type Post = {
  id: number;
  title: string;
  shortDescription: string;
  fullDescription: string;
  author: string;
  date: string;
  status: string;
  tags: string[];
  image: string;
}

export const MockPosts: Post[] = [
  {
    id: 1,
    title: 'Campus Recycling System',
    shortDescription: 'Revamp bins and awareness',
    fullDescription: 'Redesign recycling bins and raise student awareness.',
    author: 'Jane Doe',
    date: '2025-05-20',
    status: 'Open',
    tags: ['Sustainability'],
    image: 'https://picsum.photos/seed/1/200/200',
  },
  {
    id: 2,
    title: 'AI Tutoring Platform',
    shortDescription: 'Connect students with AI tutors',
    fullDescription: 'Build an AI-powered open tutoring system.',
    author: 'John Smith',
    date: '2025-05-18',
    status: 'In Progress',
    tags: ['AI'],
    image: 'https://picsum.photos/seed/2/200/200',
  },
  {
    id: 3,
    title: 'Club Website System',
    shortDescription: 'Redesign club portals',
    fullDescription: 'Modernize student club portals and event coordination.',
    author: 'Alice Nguyen',
    date: '2025-05-15',
    status: 'Closed',
    tags: ['Web'],
    image: 'https://picsum.photos/seed/3/200/200',
  },
  // Add more as needed
];