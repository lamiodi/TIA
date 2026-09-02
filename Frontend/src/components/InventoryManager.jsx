import { useState, useEffect, Fragment } from 'react';
import {
  Package,
  Trash2,
  Edit,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Upload,
  GripVertical,
  Film,
  Video,
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getThumbnailUrl } from '../utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/inventory`,
  timeout: 10000,
});

const InventoryManager = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [conflictInfo, setConflictInfo] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [productRes, bundleRes] = await Promise.all([
        api.get('/products'),
        api.get('/bundles'),
      ]);
      setProducts(productRes.data || []);
      setBundles(bundleRes.data || []);
    } catch (err) {
      console.error('Fetch error:', {
        message: err.message,
        response: err.response?.data,
        stack: err.stack,
      });
      setError(err.response?.data?.error || 'Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleNewRelease = async (product) => {
    const originalStatus = product.is_new_release;
    const newStatus = !originalStatus;

    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_new_release: newStatus } : p
        )
      );

      await api.put(`/products/${product.id}`, {
        is_new_release: newStatus,
      });

      setSuccess(
        `${product.name} marked as ${newStatus ? 'New Release' : 'Standard'}`
      );
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_new_release: originalStatus } : p
        )
      );
      console.error('Update error:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError('');
      const response = await api.delete(`/${confirmDelete.type}s/${confirmDelete.id}`);

      if (response.data.error && response.data.conflictType === 'bundle') {
        setError(response.data.error);
        setConflictInfo({
          type: 'bundle',
          id: response.data.bundleId,
          name: confirmDelete.name,
        });
      } else if (response.data.error && response.data.conflictType === 'order') {
        setError(response.data.error);
        setConflictInfo({
          type: 'order',
          name: confirmDelete.name,
        });
      } else {
        if (confirmDelete.type === 'product') {
          setProducts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
        } else {
          setBundles((prev) => prev.filter((b) => b.id !== confirmDelete.id));
        }
        setSuccess(
          `${confirmDelete.type.charAt(0).toUpperCase() + confirmDelete.type.slice(1)} deleted successfully`
        );
        setConfirmDelete(null);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Deletion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    // For bundles, ensure images array is loaded
    if (type === 'bundle' && !item.images) {
      // Fetch bundle images if not already loaded
      api.get(`/bundles/${item.id}`)
        .then(response => {
          setEditingItem({ 
            ...item, 
            type,
            images: response.data.images || []
          });
        })
        .catch(err => {
          console.error('Error fetching bundle details:', err);
          setEditingItem({ ...item, type, images: [] });
        });
    } else {
      setEditingItem({ ...item, type });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setLoading(true);
      setError('');

      if (editingItem.type === 'product') {
        const { id, price, variants, description } = editingItem;
        await api.put(`/products/${id}`, {
          base_price: price,
          variants: variants,
          description: description,
        });
      } else {
        const { id, name, price, description, images } = editingItem;
        await api.put(`/bundles/${id}`, {
          name: name,
          bundle_price: price,
          description: description,
          images: images || [],
        });
      }

      setSuccess(
        `${editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)} updated successfully`
      );
      setEditingItem(null);
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryImage = (variantId, imageId) => {
    setEditingItem((prev) => {
      if (!prev || !prev.variants) return prev;
      
      const updatedVariants = prev.variants.map((v) => {
        if (v.id === variantId) {
          const currentImages = [...(v.images || [])];
          const selectedIdx = currentImages.findIndex((img) => img.id === imageId);
          if (selectedIdx === -1) return v;

          // Move selected image to position 0 (first in sequence)
          const [selectedImg] = currentImages.splice(selectedIdx, 1);
          const reordered = [selectedImg, ...currentImages];

          const updatedImages = reordered.map((img, idx) => ({
            ...img,
            is_primary: idx === 0,
          }));

          const imageIds = updatedImages.map((img) => img.id);
          api.put(`/products/variants/${variantId}/images/reorder`, { imageIds }).catch((err) => {
            console.error('Error persisting primary image reorder:', err);
          });

          return { ...v, images: updatedImages };
        }
        return v;
      });
      return { ...prev, variants: updatedVariants };
    });
  };

  const handleSetPrimaryBundleImage = (imageId) => {
    setEditingItem((prev) => {
      if (!prev || !prev.images) return prev;
      
      const currentImages = [...prev.images];
      const selectedIdx = currentImages.findIndex((img) => img.id === imageId);
      if (selectedIdx === -1) return prev;

      // Move selected image to position 0 (first in sequence)
      const [selectedImg] = currentImages.splice(selectedIdx, 1);
      const reordered = [selectedImg, ...currentImages];

      const updatedImages = reordered.map((img, idx) => ({
        ...img,
        is_primary: idx === 0,
      }));

      const imageIds = updatedImages.map((img) => img.id);
      api.put(`/bundles/${prev.id}/images/reorder`, { imageIds }).catch((err) => {
        console.error('Error saving bundle image order:', err);
      });

      return { ...prev, images: updatedImages };
    });
  };

  const handleDeleteBundleImage = async (imageId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this image?')) return;
    
    try {
      await api.delete(`/bundles/${editingItem.id}/images/${imageId}`);
      setEditingItem((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    }
  };

  const handleMoveImage = async (index, direction) => {
    const images = [...editingItem.images];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= images.length) return;
    
    // Swap
    const temp = images[index];
    images[index] = images[newIndex];
    images[newIndex] = temp;

    // Slot 0 is primary
    const updatedImages = images.map((img, idx) => ({
      ...img,
      is_primary: idx === 0,
    }));
    
    setEditingItem((prev) => ({ ...prev, images: updatedImages }));
    
    // Persist reorder to backend
    try {
      const imageIds = updatedImages.map((img) => img.id);
      await api.put(`/bundles/${editingItem.id}/images/reorder`, { imageIds });
    } catch (err) {
      console.error('Error reordering images:', err);
      setError('Failed to save image order');
    }
  };

  const handleAddBundleImages = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    
    try {
      setLoading(true);
      const response = await api.post(`/bundles/${editingItem.id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const newImages = response.data.images || [];
      setEditingItem((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newImages],
      }));
      
      // Reset file input
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariantImage = async (e, variantId, imageId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this image?')) return;

    try {
      await api.delete(`/products/images/${imageId}`);
      setEditingItem((prev) => {
        if (!prev || !prev.variants) return prev;
        const updatedVariants = prev.variants.map((v) => {
          if (v.id === variantId) {
            return { ...v, images: (v.images || []).filter((img) => img.id !== imageId) };
          }
          return v;
        });
        return { ...prev, variants: updatedVariants };
      });
    } catch (err) {
      console.error('Error deleting variant image:', err);
      setError('Failed to delete image');
    }
  };

  const handleMoveVariantImage = async (e, variantId, index, direction) => {
    e.stopPropagation();
    setEditingItem((prev) => {
      if (!prev || !prev.variants) return prev;
      const updatedVariants = prev.variants.map((v) => {
        if (v.id === variantId) {
          const images = [...(v.images || [])];
          const newIndex = direction === 'left' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= images.length) return v;
          const temp = images[index];
          images[index] = images[newIndex];
          images[newIndex] = temp;

          // In our system, the first image (index 0) is always the primary hero image
          const updatedImages = images.map((img, idx) => ({
            ...img,
            is_primary: idx === 0,
          }));

          // Persist reorder to backend
          const imageIds = updatedImages.map((img) => img.id);
          api.put(`/products/variants/${variantId}/images/reorder`, { imageIds }).catch((err) => {
            console.error('Error reordering variant images:', err);
          });

          return { ...v, images: updatedImages };
        }
        return v;
      });
      return { ...prev, variants: updatedVariants };
    });
  };

  const handleAddVariantImages = async (e, variantId) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      setLoading(true);
      const response = await api.post(`/products/variants/${variantId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newImages = response.data.images || [];
      setEditingItem((prev) => {
        if (!prev || !prev.variants) return prev;
        const updatedVariants = prev.variants.map((v) => {
          if (v.id === variantId) {
            return { ...v, images: [...(v.images || []), ...newImages] };
          }
          return v;
        });
        return { ...prev, variants: updatedVariants };
      });

      e.target.value = '';
    } catch (err) {
      console.error('Error uploading variant images:', err);
      setError('Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVariantVideo = async (e, variantId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      setVideoUploading(true);
      setError('');
      const response = await api.post(`/products/variants/${variantId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });

      const videoUrl = response.data.video_url;
      setEditingItem((prev) => {
        if (!prev || !prev.variants) return prev;
        const updatedVariants = prev.variants.map((v) => {
          if (v.id === variantId) {
            return { ...v, video_url: videoUrl };
          }
          return v;
        });
        return { ...prev, video_url: videoUrl, variants: updatedVariants };
      });

      // Update product list
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === editingItem?.id) {
            const updatedVariants = (p.variants || []).map((v) =>
              v.id === variantId ? { ...v, video_url: videoUrl } : v
            );
            return { ...p, video_url: videoUrl, variants: updatedVariants };
          }
          return p;
        })
      );

      setSuccess('Video uploaded successfully!');
      setTimeout(() => setSuccess(''), 4000);
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading variant video:', err);
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to upload video');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleDeleteVariantVideo = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      setLoading(true);
      setError('');
      await api.delete(`/products/variants/${variantId}/video`);

      setEditingItem((prev) => {
        if (!prev || !prev.variants) return prev;
        const updatedVariants = prev.variants.map((v) => {
          if (v.id === variantId) {
            return { ...v, video_url: null };
          }
          return v;
        });
        return { ...prev, variants: updatedVariants };
      });

      // Update product list
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === editingItem?.id) {
            const updatedVariants = (p.variants || []).map((v) =>
              v.id === variantId ? { ...v, video_url: null } : v
            );
            return { ...p, variants: updatedVariants };
          }
          return p;
        })
      );

      setSuccess('Video deleted successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error deleting variant video:', err);
      setError(err.response?.data?.error || 'Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBundleVideo = async (e, bundleId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      setVideoUploading(true);
      setError('');
      const response = await api.post(`/bundles/${bundleId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });

      const videoUrl = response.data.video_url;
      setEditingItem((prev) => ({
        ...prev,
        video_url: videoUrl,
      }));

      setBundles((prev) =>
        prev.map((b) => (b.id === bundleId ? { ...b, video_url: videoUrl } : b))
      );

      setSuccess('Bundle video uploaded successfully!');
      setTimeout(() => setSuccess(''), 4000);
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading bundle video:', err);
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to upload video');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleDeleteBundleVideo = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle video?')) return;

    try {
      setLoading(true);
      setError('');
      await api.delete(`/bundles/${bundleId}/video`);

      setEditingItem((prev) => ({
        ...prev,
        video_url: null,
      }));

      setBundles((prev) =>
        prev.map((b) => (b.id === bundleId ? { ...b, video_url: null } : b))
      );

      setSuccess('Bundle video deleted successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error deleting bundle video:', err);
      setError(err.response?.data?.error || 'Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id, type) => {
    setExpandedItems((prev) => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`],
    }));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku_prefix && p.sku_prefix.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBundles = bundles.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !products.length && !bundles.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin w-8 h-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by product or bundle name"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Success</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Conflict Resolution */}
      {conflictInfo && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">Resolution Required</p>
              <p>{error}</p>
              {conflictInfo.type === 'bundle' && (
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => {
                      navigate(`/bundles/${conflictInfo.id}`);
                      setConflictInfo(null);
                      setError('');
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    View Bundle
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await api.delete(`/bundles/${conflictInfo.id}`);
                        setBundles((prev) => prev.filter((b) => b.id !== conflictInfo.id));
                        setConflictInfo(null);
                        setError('');
                        setSuccess('Bundle archived. You can now delete the product.');
                        setTimeout(() => setSuccess(''), 5000);
                      } catch (err) {
                        setError(
                          'Failed to archive bundle: ' + (err.response?.data?.error || err.message)
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    Archive Bundle First
                  </button>
                </div>
              )}
              {conflictInfo.type === 'order' && (
                <p className="mt-2 text-sm text-blue-600">
                  This item cannot be deleted because it has associated orders. Consider deactivating it instead.
                </p>
              )}
            </div>
            <button onClick={() => setConflictInfo(null)} className="text-blue-700 hover:text-blue-900">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <h3 className="px-6 py-4 font-semibold text-gray-900 flex items-center text-lg">
          <Package className="mr-2 h-5 w-5" />
          Products ({filteredProducts.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Release
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Fragment key={`product-${product.id}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => toggleExpand(product.id, 'product')}
                          className="flex items-center gap-1.5 text-left"
                        >
                          {expandedItems[`product-${product.id}`] ? (
                            <ChevronUp className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span>{product.name}</span>
                          {(product.video_url || product.variants?.some((v) => v.video_url)) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex-shrink-0" title="Has active video">
                              <Film size={10} />
                              Video
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.design_code || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₦{Number(product.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <label className="inline-flex items-center cursor-pointer select-none">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={!!product.is_new_release}
                              onChange={() => handleToggleNewRelease(product)}
                              disabled={loading}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </div>
                          <span className="ml-2 text-xs font-medium text-gray-700">
                            {product.is_new_release ? 'Yes' : 'No'}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                        <button
                          onClick={() => handleEdit(product, 'product')}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          disabled={loading}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              type: 'product',
                              id: product.id,
                              name: product.name,
                            })
                          }
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {expandedItems[`product-${product.id}`] && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Variants</h4>
                            {product.variants?.length > 0 ? (
                              <div className="space-y-4">
                                {product.variants.map((variant) => (
                                  <div
                                    key={`variant-${variant.id}`}
                                    className="border border-gray-200 rounded-lg p-4"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-gray-900">{variant.color_name}</p>
                                        <p className="text-sm text-gray-500">{variant.sku}</p>
                                      </div>
                                      {variant.video_url && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                                          <Film size={12} />
                                          Video Active
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Sizes</h5>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {variant.sizes?.map((size) => (
                                          <div
                                            key={`size-${variant.id}-${size.size_id}`}
                                            className="border border-gray-200 p-2 rounded-lg"
                                          >
                                            <p className="font-medium text-gray-900">{size.size_name}</p>
                                            <p className="text-sm text-gray-600">Stock: {size.stock_quantity}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No variants found</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bundle Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <h3 className="px-6 py-4 font-semibold text-gray-900 flex items-center text-lg">
          <Package className="mr-2 h-5 w-5" />
          Bundles ({filteredBundles.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBundles.length > 0 ? (
                filteredBundles.map((bundle) => (
                  <Fragment key={`bundle-${bundle.id}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => toggleExpand(bundle.id, 'bundle')}
                          className="flex items-center gap-1.5 text-left"
                        >
                          {expandedItems[`bundle-${bundle.id}`] ? (
                            <ChevronUp className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span>{bundle.name}</span>
                          {bundle.video_url && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex-shrink-0" title="Has active video">
                              <Film size={10} />
                              Video
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bundle.bundle_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₦{Number(bundle.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bundle.item_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            bundle.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bundle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                        <button
                          onClick={() => handleEdit(bundle, 'bundle')}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          disabled={loading}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              type: 'bundle',
                              id: bundle.id,
                              name: bundle.name,
                            })
                          }
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {expandedItems[`bundle-${bundle.id}`] && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Bundle Items</h4>
                            {bundle.items?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bundle.items.map((item) => (
                                  <div
                                    key={`bundle-item-${bundle.id}-${item.product_id}-${item.color_id}-${item.size_id}`}
                                    className="border border-gray-200 rounded-lg p-4"
                                  >
                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                    <p className="text-sm text-gray-500">
                                      {item.color_name} - {item.size_name} (Qty: {item.quantity})
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No items found in this bundle</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No bundles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full mx-4 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-900">Edit {editingItem.type}</h4>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editingItem.name || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editingItem.description || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingItem.type === 'product' ? 'Base Price' : 'Bundle Price'} (NGN)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editingItem.price}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      price: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {editingItem.type === 'product' && editingItem.variants?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variant Stock</label>
                  <div className="space-y-3">
                    {editingItem.variants.map((variant) => (
                      <div
                        key={`edit-variant-${variant.id}`}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <p className="font-medium text-gray-900 text-sm md:text-base">{variant.color_name}</p>
                        <div className="mt-2 space-y-2">
                          {variant.sizes?.map((size) => (
                            <div
                              key={`edit-size-${variant.id}-${size.size_id}`}
                              className="flex items-center gap-2"
                            >
                              <span className="w-16 md:w-20 text-sm text-gray-600 truncate">{size.size_name}:</span>
                              <input
                                type="number"
                                min="0"
                                className="flex-1 min-w-0 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                value={size.stock_quantity}
                                onChange={(e) => {
                                  const updatedVariants = editingItem.variants.map((v) => {
                                    if (v.id === variant.id) {
                                      const updatedSizes = v.sizes.map((s) => {
                                        if (s.size_id === size.size_id) {
                                          return { ...s, stock_quantity: e.target.value };
                                        }
                                        return s;
                                      });
                                      return { ...v, sizes: updatedSizes };
                                    }
                                    return v;
                                  });
                                  setEditingItem({
                                    ...editingItem,
                                    variants: updatedVariants,
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Image Management */}
                        <div className="mt-4 border-t pt-3">
                          <h6 className="text-sm font-medium text-gray-700 mb-2">Images</h6>
                          <div className="space-y-3">
                            {/* Upload button for this variant */}
                            <div>
                              <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer w-fit text-xs">
                                <Upload size={14} />
                                <span className="font-medium">Add Images</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleAddVariantImages(e, variant.id)}
                                  disabled={loading}
                                />
                              </label>
                            </div>

                            {/* Image list */}
                            {variant.images && variant.images.length > 0 ? (
                              <div className="grid grid-cols-1 gap-1.5">
                                {variant.images.map((img, imgIndex) => (
                                  <div
                                    key={`img-${img.id}`}
                                    className={`relative flex items-center gap-2 p-1.5 rounded-lg border-2 transition-all ${
                                      img.is_primary
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                  >
                                    <img
                                      src={getThumbnailUrl(img.image_url, 100)}
                                      alt={`Variant image ${imgIndex + 1}`}
                                      className="w-10 h-10 object-cover rounded flex-shrink-0 cursor-pointer"
                                      onClick={() => handleSetPrimaryImage(variant.id, img.id)}
                                      loading="lazy"
                                      decoding="async"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-gray-400">#{imgIndex + 1}</span>
                                        {img.is_primary && (
                                          <span className="text-[9px] font-bold bg-blue-500 text-white px-1 py-0.5 rounded">
                                            PRIMARY
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-0.5 mt-0.5">
                                        <button
                                          type="button"
                                          onClick={(e) => handleMoveVariantImage(e, variant.id, imgIndex, 'left')}
                                          disabled={imgIndex === 0}
                                          className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                          title="Move left"
                                        >
                                          <ChevronLeft size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleMoveVariantImage(e, variant.id, imgIndex, 'right')}
                                          disabled={imgIndex === variant.images.length - 1}
                                          className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                          title="Move right"
                                        >
                                          <ChevronRight size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetPrimaryImage(variant.id, img.id)}
                                          className="p-0.5 rounded hover:bg-blue-100 text-blue-600"
                                          title="Set as primary"
                                        >
                                          <CheckCircle size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteVariantImage(e, variant.id, img.id)}
                                          className="p-0.5 rounded hover:bg-red-100 text-red-500"
                                          title="Delete image"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 text-center py-2">No images for this variant</p>
                            )}
                          </div>
                        </div>

                        {/* Video Management for Variant */}
                        <div className="mt-4 border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                              <Film size={15} className="text-purple-600" />
                              <span>Variant Video</span>
                            </h6>
                            {variant.video_url && (
                              <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Active Video
                              </span>
                            )}
                          </div>

                          {variant.video_url ? (
                            <div className="space-y-2 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                              <video
                                src={variant.video_url}
                                controls
                                playsInline
                                className="w-full max-h-44 rounded-lg bg-black object-contain shadow-sm"
                              />
                              <div className="flex items-center gap-2 pt-1">
                                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer text-xs font-medium shadow-sm">
                                  <Upload size={13} />
                                  <span>{videoUploading ? 'Uploading...' : 'Replace Video'}</span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => handleUploadVariantVideo(e, variant.id)}
                                    disabled={videoUploading || loading}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariantVideo(variant.id)}
                                  disabled={videoUploading || loading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-xs font-medium"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete Video</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer w-fit text-xs font-medium">
                                <Upload size={14} />
                                <span>{videoUploading ? 'Uploading Video...' : 'Add Video'}</span>
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={(e) => handleUploadVariantVideo(e, variant.id)}
                                  disabled={videoUploading || loading}
                                />
                              </label>
                              <p className="text-[11px] text-gray-400 mt-1">Accepts MP4, MOV, WebM</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bundle Image Management */}
              {editingItem.type === 'bundle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bundle Images</label>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                    {/* Upload button */}
                    <div>
                      <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer w-fit">
                        <Upload size={16} />
                        <span className="text-sm font-medium">Add Images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleAddBundleImages}
                          disabled={loading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Upload up to 10 images at once. JPG, PNG, WebP.</p>
                    </div>

                    {/* Image list */}
                    {editingItem.images && editingItem.images.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">
                          {editingItem.images.length} image{editingItem.images.length !== 1 ? 's' : ''} · Click to set primary · Use arrows to reorder
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {editingItem.images.map((img, index) => (
                            <div
                              key={`bundle-img-${img.id}`}
                              className={`relative flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                                img.is_primary
                                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              {/* Thumbnail */}
                              <img
                                src={getThumbnailUrl(img.image_url, 140)}
                                alt={`Bundle image ${index + 1}`}
                                className="w-14 h-14 object-cover rounded flex-shrink-0 cursor-pointer"
                                onClick={() => handleSetPrimaryBundleImage(img.id)}
                                loading="lazy"
                                decoding="async"
                              />

                              {/* Info + Controls */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                                  {img.is_primary && (
                                    <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">
                                      PRIMARY
                                    </span>
                                  )}
                                </div>

                                {/* Reorder + Delete buttons */}
                                <div className="flex items-center gap-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(index, 'left')}
                                    disabled={index === 0}
                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move left"
                                  >
                                    <ChevronLeft size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(index, 'right')}
                                    disabled={index === editingItem.images.length - 1}
                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move right"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryBundleImage(img.id)}
                                    className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                                    title="Set as primary"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteBundleImage(img.id, e)}
                                    className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                                    title="Delete image"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <Upload size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No images yet. Upload some above.</p>
                      </div>
                    )}
                  </div>

                  {/* Bundle Video Management */}
                  <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Film size={16} className="text-purple-600" />
                        <span>Bundle Video</span>
                      </label>
                      {editingItem.video_url && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          Active Video
                        </span>
                      )}
                    </div>

                    {editingItem.video_url ? (
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-purple-100">
                        <video
                          src={editingItem.video_url}
                          controls
                          playsInline
                          className="w-full max-h-56 rounded-lg bg-black object-contain shadow-sm"
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer text-xs font-medium shadow-sm">
                            <Upload size={13} />
                            <span>{videoUploading ? 'Uploading...' : 'Replace Video'}</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => handleUploadBundleVideo(e, editingItem.id)}
                              disabled={videoUploading || loading}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteBundleVideo(editingItem.id)}
                            disabled={videoUploading || loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-xs font-medium"
                          >
                            <Trash2 size={13} />
                            <span>Delete Video</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer w-fit">
                          <Upload size={16} />
                          <span className="text-sm font-medium">
                            {videoUploading ? 'Uploading Video...' : 'Add Video'}
                          </span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => handleUploadBundleVideo(e, editingItem.id)}
                            disabled={videoUploading || loading}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Upload MP4, MOV, or WebM video for this bundle.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="animate-spin h-4 w-4" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl border border-gray-100">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Delete {confirmDelete.type}?</h4>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete{' '}
              <strong className="font-semibold">{confirmDelete.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
