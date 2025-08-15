import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

// Create API instance with environment variable support
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com'}/api`
});

export default function BundleCreator() {
  const [skuPrefixes, setSkuPrefixes] = useState([]);
  const [products, setProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fileKey, setFileKey] = useState(0); // For resetting file input

  const [form, setForm] = useState({
    name: '',
    description: '',
    bundle_price: '',
    sku_prefix: '',
    bundle_type: '3-in-1',
    product_id: '',
  });

  // Clean up image preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [skuRes, productsRes] = await Promise.all([
          api.get('/bundles/sku-prefixes'),
          api.get('/bundles/products'),
        ]);
        setSkuPrefixes(skuRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load required data');
      }
    };
    fetchMeta();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('You can upload a maximum of 5 images.');
      return;
    }
    
    setImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Bundle name is required';
    if (!form.bundle_price || isNaN(form.bundle_price)) return 'Valid price is required';
    if (!form.sku_prefix) return 'SKU prefix is required';
    if (!form.product_id) return 'Please select a product';
    if (images.length === 0) return 'Please upload at least 1 image';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      const data = new FormData();
      data.append('data', JSON.stringify(form));
      images.forEach((img) => data.append('images', img));
      
      await api.post('/bundles', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(true);
      setForm({
        name: '',
        description: '',
        bundle_price: '',
        sku_prefix: '',
        bundle_type: '3-in-1',
        product_id: '',
      });
      setImages([]);
      setImagePreviews([]);
      setFileKey(prev => prev + 1); // Reset file input
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create bundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Bundle</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Bundle created successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name</label>
          <input
            type="text"
            placeholder="Enter bundle name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            placeholder="Enter bundle description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="4"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Price (NGN)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter bundle price"
            value={form.bundle_price}
            onChange={(e) => setForm({ ...form, bundle_price: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Type</label>
          <select
            value={form.bundle_type}
            onChange={(e) => setForm({ ...form, bundle_type: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="3-in-1">3-in-1</option>
            <option value="5-in-1">5-in-1</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU Prefix</label>
          <select
            value={form.sku_prefix}
            onChange={(e) => setForm({ ...form, sku_prefix: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">-- Select SKU Prefix --</option>
            {skuPrefixes.map((sku) => (
              <option key={sku} value={sku}>
                {sku}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">-- Select Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku_prefix})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images (Max 5)</label>
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={preview}
                    alt={`preview-${idx}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...images];
                      const newPreviews = [...imagePreviews];
                      newImages.splice(idx, 1);
                      newPreviews.splice(idx, 1);
                      setImages(newImages);
                      setImagePreviews(newPreviews);
                      URL.revokeObjectURL(preview);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          Create Bundle
        </button>
      </form>
    </div>
  );
}