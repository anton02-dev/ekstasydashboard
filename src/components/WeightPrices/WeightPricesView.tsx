import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Weight } from 'lucide-react';
import { weightPricesApi } from '../../lib/api';
import { WeightPrice } from '../../types';
import WeightPriceModal from './WeightPriceModal';

export default function WeightPricesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWeightPrice, setEditingWeightPrice] = useState<WeightPrice | null>(null);

  const queryClient = useQueryClient();

  const { data: weightPrices, isLoading } = useQuery({
    queryKey: ['weightPrices'],
    queryFn: () => weightPricesApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => weightPricesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightPrices'] });
    },
  });

  const handleEdit = (weightPrice: WeightPrice) => {
    setEditingWeightPrice(weightPrice);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this weight price range?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Weight-Based Pricing</h2>
          <p className="text-slate-600 mt-2">Set shipping prices for different weight ranges</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingWeightPrice(null);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus size={20} />
          Add Weight Range
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-slate-200"
      >
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {weightPrices?.map((wp) => (
                <motion.div
                  key={wp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-6 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Weight size={24} className="text-white" />
                    </div>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(wp)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(wp.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-slate-600">Weight Range</p>
                      <p className="text-lg font-bold text-slate-900">
                        {wp.firstNumber} - {wp.secondNumber} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Shipping Price</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${wp.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <WeightPriceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWeightPrice(null);
        }}
        weightPrice={editingWeightPrice}
      />
    </div>
  );
}
