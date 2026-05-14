'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('~components/home/views/Editor').then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className='h-full' />,
});

const HomePage = () => <Editor />;
export default HomePage;
