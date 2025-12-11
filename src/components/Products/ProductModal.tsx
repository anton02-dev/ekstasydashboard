import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../../lib/api';
import { Product } from '../../types';
import axios from 'axios';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

// Get the API base URL from environment or use relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    stock: 0,
    sku: '',
    ean: '',
    title: '',
    description: '',
    specs: '',
    characteristics: '',
    price: 0,
    mainImg: '',
    galleryImgs: [] as string[],
    categorie: 0,
    weight: 0,
  });
  
  const [mainImgFile, setMainImgFile] = useState<File | null>(null);
  const [mainImgPreview, setMainImgPreview] = useState<string>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((res) => res.data),
  });

  useEffect(() => {
    if (product) {
      const galleryArray = Array.isArray(product.galleryImgs) 
        ? product.galleryImgs 
        : typeof product.galleryImgs === 'string' 
          ? product.galleryImgs.split(',').filter(img => img.trim())
          : [];
      
      setFormData({
        stock: product.stock,
        sku: product.sku,
        ean: product.ean,
        title: product.title,
        description: product.description,
        specs: product.specs,
        characteristics: product.characteristics,
        price: product.price || 0,
        mainImg: product.mainImg,
        galleryImgs: galleryArray,
        categorie: product.categorie,
        weight: product.weight || 0,
      });
      
      // Set main image preview - handle both full URLs and filenames
      const mainImgUrl = product.mainImg.startsWith('https') 
        ? product.mainImg 
        : `https://pcexpert.store/downloaded_images/${product.mainImg}`;
      setMainImgPreview(mainImgUrl);
      
      // Set gallery previews - handle both full URLs and filenames
      const galleryUrls = galleryArray.map(img => 
        img.startsWith('https') ? img : `https://pcexpert.store/downloaded_images/${img}`
      );
      setGalleryPreviews(galleryUrls);
      setExistingGalleryUrls(galleryUrls);
    } else {
      setFormData({
        stock: 0,
        sku: '',
        ean: '',
        title: '',
        description: '',
        specs: '',
        characteristics: '',
        price: 0,
        mainImg: '',
        galleryImgs: [],
        categorie: 0,
        weight: 0,
      });
      setMainImgPreview('');
      setGalleryPreviews([]);
      setExistingGalleryUrls([]);
    }
    setMainImgFile(null);
    setGalleryFiles([]);
  }, [product]);

  const uploadImage = async (file: File): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    
    // Get auth token from localStorage or wherever you store it
    const token = localStorage.getItem('access_token');
    
    const response = await axios.post(
      `${API_BASE_URL}/upload-image`, 
      uploadFormData, 
      {
        headers: { 
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      }
    );
    
    return response.data.filename;
  };

  const handleMainImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImgFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImgPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    // Check if this is an existing image or a new upload
    if (index < existingGalleryUrls.length) {
      // Remove from existing images
      setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new uploads
      const newFileIndex = index - existingGalleryUrls.length;
      setGalleryFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
    
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (data: Omit<Product, 'id'>) => productsApi.create({data: data}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      productsApi.update(id, {data: data}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let mainImgFilename = formData.mainImg;
      
      // Upload main image if a new file was selected
      if (mainImgFile) {
        mainImgFilename = await uploadImage(mainImgFile);
      } else if (mainImgFilename.startsWith('http')) {
        // Extract just the filename if it's a full URL
        mainImgFilename = mainImgFilename.split('/').pop() || '';
      }

      // Handle gallery images
      const uploadedGalleryFilenames: string[] = [];
      
      // Add existing gallery images that weren't removed
      existingGalleryUrls.forEach(url => {
        const filename = url.split('/').pop() || '';
        if (filename) {
          uploadedGalleryFilenames.push(filename);
        }
      });
      
      // Upload new gallery files
      for (const file of galleryFiles) {
        const filename = await uploadImage(file);
        uploadedGalleryFilenames.push(filename);
      }

      const submitData = {
        ...formData,
        mainImg: mainImgFilename,
        galleryImgs: uploadedGalleryFilenames,
      };

      if (product) {
        updateMutation.mutate({ id: product.id, data: submitData });
      } else {
        createMutation.mutate(submitData);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setIsUploading(false);
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">
                  {product ? 'Edit Product' : 'Add Product'}
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
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                  <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                         <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    EAN
                  </label>
                  <input
                    type="text"
                    value={formData.ean}
                    onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    required
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value={0}>Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Main Image
                  </label>
                  <div className="space-y-3">
                    {mainImgPreview && (
                      <div className="relative w-full h-48 border-2 border-slate-200 rounded-lg overflow-hidden">
                        <img 
                          src={mainImgPreview} 
                          alt="Main preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                      <Upload size={20} className="text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {mainImgPreview ? 'Change Main Image' : 'Upload Main Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Gallery Images Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Gallery Images
                  </label>
                  <div className="space-y-3">
                    {galleryPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={preview} 
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                      <ImageIcon size={20} className="text-slate-500" />
                      <span className="text-sm text-slate-600">Add Gallery Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryImagesSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Specifications
                  </label>
                  <textarea
                    rows={3}
                    value={formData.specs}
                    onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Characteristics
                  </label>
                  <textarea
                    rows={3}
                    value={formData.characteristics}
                    onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    disabled={isUploading}
                    whileHover={{ scale: isUploading ? 1 : 1.02 }}
                    whileTap={{ scale: isUploading ? 1 : 0.98 }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : product ? 'Update Product' : 'Create Product'}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={isUploading}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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