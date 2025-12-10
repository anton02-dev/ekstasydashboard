import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Filter,
  Weight,
  Menu,
  X,
  Heart, // Changed an icon for a more fitting one, if available in lucide-react (using Heart as a general stand-in)
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'filters', label: 'Filters', icon: Filter },
  { id: 'weight-prices', label: 'Shipping', icon:   Weight }, // Renamed label
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  return (
    <>
      {isAuthenticated && ( 

     <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-pink-700 hover:bg-pink-600 text-white p-2 rounded-xl shadow-lg transition-colors" // Deep pink button
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        // Darker background, rich purple-black
        className="fixed left-0 top-0 h-screen w-64 bg-slate-950 text-white shadow-2xl shadow-pink-900/50 z-40 lg:translate-x-0"
      >
        <div className="p-6 border-b border-pink-900/50">
          <h1 
            // Logo text: Luxurious script font look with a deep red/gold gradient
            className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-pink-400 via-rose-500 to-red-600 bg-clip-text text-transparent italic" 
          >
            Ekstasy
          </h1>
          <p className="text-pink-300 text-sm mt-1 font-light">Dashboard</p> {/* Subtitle updated */}
        </div>

        <nav className="p-4 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                whileHover={{ scale: 1.03, x: 4 }} // Subtle scale and hover shift
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${ // Rounded corners
                  isActive
                    // Active style: Deep red/pink gradient with subtle shadow
                    ? 'bg-gradient-to-r from-pink-700 to-rose-600 text-white font-semibold shadow-xl shadow-pink-900/50'
                    // Inactive style: Lighter text, dark hover
                    : 'text-pink-200 hover:bg-pink-900/30 hover:text-pink-100'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-pink-100' : 'text-pink-300'} /> 
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </motion.aside>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          // Overlay is black with a slight pinkish tint
          className="fixed inset-0 bg-black/70 z-30 lg:hidden" 
        />
  
      )}
      </>
       )}
    </>
  );
}