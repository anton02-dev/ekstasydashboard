import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { categoriesApi } from '../../lib/api';
import { Category } from '../../types';
import CategoryModal from './CategoryModal';

export default function CategoriesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const mainCategories = categories?.filter((c) => !c.parentId || c.parentId === 0);
  const getSubcategories = (parentId: number) =>
    categories?.filter((c) => c.parentId === parentId) || [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Categories</h2>
          <p className="text-slate-600 mt-2">Organize your product categories and subcategories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus size={20} />
          Add Category
        </motion.button>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <AnimatePresence>
            {mainCategories?.map((category) => {
              const subcategories = getSubcategories(category.id);

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                >
                  <div className="p-6 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                        <FolderTree size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
                        <p className="text-sm text-slate-600">
                          {subcategories.length} subcategories
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={20} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </div>
                  </div>

                  {subcategories.length > 0 && (
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                        {subcategories.map((sub) => (
                          <motion.div
                            key={sub.id}
                            whileHover={{ scale: 1.02 }}
                            className="bg-slate-50 rounded-lg p-4 flex items-center justify-between border border-slate-200"
                          >
                            <span className="text-slate-700 font-medium">{sub.name}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(sub)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(sub.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
      />
    </div>
  );
}
