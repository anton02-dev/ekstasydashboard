import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import DashboardView from './components/Dashboard/DashboardView';
import ProductsView from './components/Products/ProductsView';
import OrdersView from './components/Orders/OrdersView';
import CategoriesView from './components/Categories/CategoriesView';
import FiltersView from './components/Filters/FiltersView';
import WeightPricesView from './components/WeightPrices/WeightPricesView';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isAuthenticated, isLoading } = useAuth();

  const renderContent = () => {
    if (isLoading) return <p>Loading...</p>;
    if (!isAuthenticated) return <Login />;
    
    switch (activeSection) {
      case 'dashboard': return <DashboardView />;
      case 'products': return <ProductsView />;
      case 'orders': return <OrdersView />;
      case 'categories': return <CategoriesView />;
      case 'filters': return <FiltersView />;
      case 'weight-prices': return <WeightPricesView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <motion.main
        key={activeSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="lg:ml-64 p-4 lg:p-8"
      >
        {renderContent()}
      </motion.main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

