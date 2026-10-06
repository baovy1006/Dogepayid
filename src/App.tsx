import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import NotFound from './pages/NotFound';
import Index from './pages/Index';

const App = () => {
    return (
        <>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
        </>
    );
};

export default App;

