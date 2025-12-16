import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Image as ImageIcon, Plus, Edit2, Package } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, variantsApi } from '../../lib/api';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function VariantModal({ isOpen, onClose, variant, productId, onSave }) {
  const [formData, setFormData] = useState({
    variant_name: '',
    sku: '',
    ean: '',
    price: 0,
    stock: 0,
    weight: 0,
    main_img: '',
    galleryImgs: []
  });

  const [mainImgFile, setMainImgFile] = useState(null);
  const [mainImgPreview, setMainImgPreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (variant) {
      setFormData({
        variant_name: variant.variant_name || '',
        sku: variant.sku || '',
        ean: variant.ean || '',
        price: variant.price || 0,
        stock: variant.stock || 0,
        weight: variant.weight || 0,
        main_img: variant.main_img || '',
        galleryImgs: variant.galleryImgs || []
      });

      if (variant.main_img) {
        const url = variant.main_img.startsWith('https') 
          ? variant.main_img 
          : `https://ekstasy.it/downloaded_images/${variant.main_img}`;
        setMainImgPreview(url);
      }

      const galleryArray = Array.isArray(variant.galleryImgs) 
        ? variant.galleryImgs 
        : [];
      
      const galleryUrls = galleryArray.map(img => 
        img.startsWith('https') ? img : `https://ekstasy.it/downloaded_images/${img}`
      );
      setGalleryPreviews(galleryUrls);
      setExistingGalleryUrls(galleryUrls);
    } else {
      resetForm();
    }
  }, [variant]);

  const resetForm = () => {
    setFormData({
      variant_name: '',
      sku: '',
      ean: '',
      price: 0,
      stock: 0,
      weight: 0,
      main_img: '',
      galleryImgs: []
    });
    setMainImgPreview('');
    setGalleryPreviews([]);
    setExistingGalleryUrls([]);
    setMainImgFile(null);
    setGalleryFiles([]);
  };

  const handleMainImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImgFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImgPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index) => {
    if (index < existingGalleryUrls.length) {
      setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      const newFileIndex = index - existingGalleryUrls.length;
      setGalleryFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let mainImgFilename = formData.main_img;
      
      if (mainImgFile) {
        mainImgFilename = await uploadImage(mainImgFile);
      } else if (mainImgFilename.startsWith('https')) {
        mainImgFilename = mainImgFilename.split('/').pop() || '';
      }

      const uploadedGalleryFilenames = [];
      
      existingGalleryUrls.forEach(url => {
        const filename = url.split('/').pop() || '';
        if (filename) uploadedGalleryFilenames.push(filename);
      });
      
      for (const file of galleryFiles) {
        const filename = await uploadImage(file);
        uploadedGalleryFilenames.push(filename);
      }

      const submitData = {
        ...formData,
        main_img: mainImgFilename,
        galleryImgs: uploadedGalleryFilenames,
      };

      if (variant) {
        await variantsApi.updateVariant(variant.id, submitData);
      } else {
        await variantsApi.createVariant(productId, submitData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error saving variant. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[70]"
      />
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold text-slate-900">
              {variant ? 'Edit Variant' : 'Add New Variant'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Variant Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Red - Size L, 128GB Storage"
                value={formData.variant_name}
                onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">EAN</label>
                <input
                  type="text"
                  value={formData.ean}
                  onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Price ($) *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Variant Images</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Main Image</label>
                <div className="space-y-3">
                  {mainImgPreview && (
                    <div className="relative w-full h-40 border-2 border-slate-200 rounded-lg overflow-hidden">
                      <img src={mainImgPreview} alt="Main preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <Upload size={18} className="text-slate-500" />
                    <span className="text-sm text-slate-600">
                      {mainImgPreview ? 'Change Image' : 'Upload Image'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleMainImageSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images</label>
                <div className="space-y-3">
                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <ImageIcon size={18} className="text-slate-500" />
                    <span className="text-sm text-slate-600">Add Gallery Images</span>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryImagesSelect} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Saving...' : variant ? 'Update Variant' : 'Create Variant'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function ProductModal({ isOpen, onClose, product }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    stock: 0,
    discount: 0,
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
  
  const [mainImgFile, setMainImgFile] = useState(null);
  const [mainImgPreview, setMainImgPreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Variant management state
  const [showVariants, setShowVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((res) => res.data),
  });

  // Fetch variants when product changes
  useEffect(() => {
    if (product?.id) {
      fetchVariants();
    }
  }, [product?.id]);

  const fetchVariants = async () => {
    if (!product?.id) return;
    try {
      const response = await variantsApi.getVariants(product.id);
      setVariants(response.data || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  useEffect(() => {
    if (product) {
      const galleryArray = Array.isArray(product.galleryImgs) 
        ? product.galleryImgs 
        : typeof product.galleryImgs === 'string' 
          ? product.galleryImgs.split(',').filter(img => img.trim())
          : [];
      
      setFormData({
        stock: product.stock,
        discount: product.discount,
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
      
      const mainImgUrl = product.mainImg.startsWith('https') 
        ? product.mainImg 
        : `https://ekstasy.it/downloaded_images/${product.mainImg}`;
      setMainImgPreview(mainImgUrl);
      
      const galleryUrls = galleryArray.map(img => 
        img.startsWith('https') ? img : `https://ekstasy.it/downloaded_images/${img}`
      );
      setGalleryPreviews(galleryUrls);
      setExistingGalleryUrls(galleryUrls);
    } else {
      setFormData({
        stock: 0,
        discount: 0,
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
      setVariants([]);
    }
    setMainImgFile(null);
    setGalleryFiles([]);
    setShowVariants(false);
  }, [product]);

  const uploadImage = async (file) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    
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

  const handleMainImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImgFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImgPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index) => {
    if (index < existingGalleryUrls.length) {
      setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      const newFileIndex = index - existingGalleryUrls.length;
      setGalleryFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
    
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (data) => productsApi.create({data: data}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      productsApi.update(id, {data: data}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let mainImgFilename = formData.mainImg;
      
      if (mainImgFile) {
        mainImgFilename = await uploadImage(mainImgFile);
      } else if (mainImgFilename.startsWith('https')) {
        mainImgFilename = mainImgFilename.split('/').pop() || '';
      }

      const uploadedGalleryFilenames = [];
      
      existingGalleryUrls.forEach(url => {
        const filename = url.split('/').pop() || '';
        if (filename) {
          uploadedGalleryFilenames.push(filename);
        }
      });
      
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

  const handleAddVariant = () => {
    setSelectedVariant(null);
    setVariantModalOpen(true);
  };

  const handleEditVariant = (variant) => {
    setSelectedVariant(variant);
    setVariantModalOpen(true);
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    
    try {
      await variantsApi.deleteVariant(variantId);
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Error deleting variant. Please try again.');
    }
  };

  const handleVariantSave = () => {
    fetchVariants();
    setVariantModalOpen(false);
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
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Discount(%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
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

                {/* Variants Section - Only show when editing existing product */}
                {product && (
                  <div className="border-t pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setShowVariants(!showVariants)}
                        className="flex items-center gap-2 text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        <Package size={20} />
                        Product Variants ({variants.length})
                        <motion.div
                          animate={{ rotate: showVariants ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X size={16} className="transform rotate-45" />
                        </motion.div>
                      </button>
                      
                      {showVariants && (
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={18} />
                          Add Variant
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showVariants && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {variants.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                              No variants yet. Click "Add Variant" to create one.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {variants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                                >
                                  {variant.main_img && (
                                    <img
                                      src={variant.main_img.startsWith('https') 
                                        ? variant.main_img 
                                        : `https://ekstasy.it/downloaded_images/${variant.main_img}`}
                                      alt={variant.variant_name}
                                      className="w-16 h-16 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900">
                                      {variant.variant_name}
                                    </h4>
                                    <div className="text-sm text-slate-600 mt-1">
                                      <span className="font-medium">${variant.price}</span>
                                      {' • '}
                                      Stock: {variant.stock}
                                      {variant.sku && ` • SKU: ${variant.sku}`}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditVariant(variant)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <Edit2 size={18} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVariant(variant.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

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

          {/* Variant Modal */}
          <VariantModal
            isOpen={variantModalOpen}
            onClose={() => setVariantModalOpen(false)}
            variant={selectedVariant}
            productId={product?.id}
            onSave={handleVariantSave}
          />
        </>
      )}
    </AnimatePresence>
  );
}