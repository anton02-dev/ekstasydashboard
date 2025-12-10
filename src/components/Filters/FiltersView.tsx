import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Filter as FilterIcon } from 'lucide-react';
import { filtersApi, categoriesApi } from '../../lib/api';
import { Filter } from '../../types';
import FilterModal from './FilterModal';

export default function FiltersView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: filters, isLoading } = useQuery({
    queryKey: ['filters'],
    queryFn: () => filtersApi.getAll().then((res) => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => filtersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filters'] });
    },
  });

  const filteredFilters = filters?.filter((f) =>
    selectedCategory ? f.categoryId === selectedCategory : true
  );

  const handleEdit = (filter: Filter) => {
    setEditingFilter(filter);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this filter?')) {
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
          <h2 className="text-3xl font-bold text-slate-900">Filters</h2>
          <p className="text-slate-600 mt-2">Manage product filtering options</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingFilter(null);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus size={20} />
          Add Filter
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-slate-200"
      >
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Filter by Category
          </label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredFilters?.map((filter) => (
                <motion.div
                  key={filter.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <FilterIcon size={20} className="text-white" />
                    </div>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(filter)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(filter.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{filter.name}</h3>
                  <p className="text-sm text-slate-600">
                    Category: {categories?.find((c) => c.id === filter.categoryId)?.name || 'N/A'}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <FilterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFilter(null);
        }}
        filter={editingFilter}
      />
    </div>
  );
}
