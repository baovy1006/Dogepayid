import { Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/layout/AppShell';
import Activity from './pages/Activity';
import Contacts from './pages/Contacts';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import Pay from './pages/Pay';

const App = () => (
    <>
        <Routes>
            <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pay" element={<Pay />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
        <Toaster />
    </>
);

export default App;
