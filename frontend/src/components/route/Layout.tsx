import React, { useState } from 'react';
import Sidebar from '../ui/sidebar';
import Header from '../ui/header';

export default function Layout() {
  const [isHidden, setIsHidden] = useState(false);

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Sidebar */}
      <Sidebar isHidden={isHidden}/>

      {/* animate transform so main content smoothly shifts when sidebar toggles */}
      <main className={`flex-1 flex flex-col overflow-auto transform transition-transform duration-300 ${isHidden ? 'translate-x-0' : 'translate-x-64'}`}>
        {/* Header */}
        <Header title='Title Here' subtitle='Subtitle Here' toggleSidebar={() => setIsHidden(!isHidden)}/>

        {/* Main content goes here */}
      </main>
    </div>
  )
}
