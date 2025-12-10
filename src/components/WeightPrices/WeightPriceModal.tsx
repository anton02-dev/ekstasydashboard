import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { weightPricesApi } from '../../lib/api';
import { WeightPrice } from '../../types';

interface WeightPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  weightPrice: WeightPrice | null;
}

export default function WeightPriceModal({ isOpen, onClose, weightPrice }: WeightPriceModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstNumber: 0,
    secondNumber: 0,
    price: 0,
  });

  useEffect(() => {
    if (weightPrice) {
      setFormData({
        firstNumber: weightPrice.firstNumber,
        secondNumber: weightPrice.secondNumber,
        price: weightPrice.price,
      });
    } else {
      setFormData({
        firstNumber: 0,
        secondNumber: 0,
        price: 0,
      });
    }
  }, [weightPrice]);

  const createMutation = useMutation({
    mutationFn: (data: Omit<WeightPrice, 'id'>) => weightPricesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightPrices'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WeightPrice> }) =>
      weightPricesApi.update(id, {data: data}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightPrices'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weightPrice) {
      updateMutation.mutate({ id: weightPrice.id, data: formData });
    } else {
      createMutation.mutate({data:formData});
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">
                  {weightPrice ? 'Edit Weight Range' : 'Add Weight Range'}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.firstNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, firstNumber: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maximum Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.secondNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, secondNumber: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Shipping Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-slate-700">
                    This shipping price will apply to products weighing between{' '}
                    <span className="font-semibold">{formData.firstNumber}kg</span> and{' '}
                    <span className="font-semibold">{formData.secondNumber}kg</span>.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {weightPrice ? 'Update Range' : 'Create Range'}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
