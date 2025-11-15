import React from 'react';
import Sidebar from '../ui/sidebar';
import Header from '../ui/header';

export default function Layout() {
  return (
    <div className='flex h-screen'>
      {/* Sidebar */}
      <div className='flex h-screen'>
        <Sidebar />
      </div>

      <main className='flex flex-1 flex-col overflow-auto'>
        {/* Header */}
        <Header title='Title Here' subtitle='Subtitle Here'/>

        {/* Main content goes here */}
      </main>
    </div>
  )
}
