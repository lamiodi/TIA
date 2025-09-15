import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle, Info } from 'lucide-react';

// Define API_BASE_URL with proper endpoint handling
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}` 
  : 'https://tia-backend-r331.onrender.com';

// Create API instance with explicit /api prefix in endpoint calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default function BundleCreator() {
  const [skuPrefixes, setSkuPrefixes] = useState([]);
  const [products, setProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
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
        // Use the correct endpoint paths with /api prefix
        const [skuRes, productsRes] = await Promise.all([
          api.get('/api/bundles/sku-prefixes'),
          api.get('/api/bundles/products'),
        ]);
        setSkuPrefixes(skuRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Error fetching bundle data:', err);
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
    const errors = {};
    
    if (!form.name.trim()) {
      errors.name = 'Bundle name is required';
    } else if (form.name.length < 3) {
      errors.name = 'Bundle name must be at least 3 characters long';
    }
    
    if (!form.description.trim()) {
      errors.description = 'Bundle description is required';
    } else if (form.description.length < 10) {
      errors.description = 'Description should be at least 10 characters to explain the bundle value';
    }
    
    if (!form.bundle_price || form.bundle_price <= 0) {
      errors.bundle_price = 'Please enter a valid bundle price greater than 0';
    }
    
    if (!form.bundle_type) {
      errors.bundle_type = 'Please select a bundle type';
    }
    
    if (!form.sku_prefix) {
      errors.sku_prefix = 'Please select a SKU prefix for the bundle';
    }
    
    if (!form.product_id) {
      errors.product_id = 'Please select a base product for this bundle';
    }
    
    if (images.length === 0) {
      errors.images = 'Please upload at least one image showing the bundle contents';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setFieldErrors({});
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the validation errors below');
      return;
    }
    
    try {
      setLoading(true);
      const data = new FormData();
      data.append('data', JSON.stringify(form));
      images.forEach((img) => data.append('images', img));
      
      // Use the correct endpoint path with /api prefix
      await api.post('/api/bundles', data, {
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
      console.error('Bundle creation error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        setError(err.response?.data?.error || 'Failed to create bundle');
      } else {
        setError('Failed to create bundle: Network error or server is down');
      }
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
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Bundle Name
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Enter a descriptive name for this product bundle
              </div>
            </div>
          </label>
          <input
            type="text"
            placeholder="Enter bundle name (e.g., Summer Essentials Bundle)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Choose a catchy name that describes what's included in the bundle</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Description
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Describe what's included and the value proposition of this bundle
              </div>
            </div>
          </label>
          <textarea
            placeholder="Describe what's included in this bundle, its benefits, and value for customers..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            rows="4"
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Explain what items are included and why customers should choose this bundle</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Bundle Price (NGN)
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Set a discounted price that's lower than buying items separately
              </div>
            </div>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter bundle price (e.g., 45000)"
            value={form.bundle_price}
            onChange={(e) => setForm({ ...form, bundle_price: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.bundle_price ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.bundle_price && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.bundle_price}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Price should offer savings compared to buying individual items</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Bundle Type
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Choose how many items are included in this bundle
              </div>
            </div>
          </label>
          <select
            value={form.bundle_type}
            onChange={(e) => setForm({ ...form, bundle_type: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.bundle_type ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="3-in-1">3-in-1 Bundle</option>
            <option value="5-in-1">5-in-1 Bundle</option>
          </select>
          {fieldErrors.bundle_type && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.bundle_type}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Select the number of items that will be included in this bundle</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            SKU Prefix
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Choose the product category this bundle belongs to
              </div>
            </div>
          </label>
          <select
            value={form.sku_prefix}
            onChange={(e) => setForm({ ...form, sku_prefix: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.sku_prefix ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          >
            <option value="">-- Select SKU Prefix --</option>
            {skuPrefixes.map((sku) => (
              <option key={sku} value={sku}>
                {sku}
              </option>
            ))}
          </select>
          {fieldErrors.sku_prefix && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.sku_prefix}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Select the category prefix that matches the main product type in this bundle</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Base Product
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Select the main product that this bundle is based on
              </div>
            </div>
          </label>
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.product_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          >
            <option value="">-- Select Base Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku_prefix})
              </option>
            ))}
          </select>
          {fieldErrors.product_id && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.product_id}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Choose the primary product that customers will receive in this bundle</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Bundle Images (Max 5)
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Upload images showing all items included in the bundle
              </div>
            </div>
          </label>
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
              fieldErrors.images ? 'border border-red-500' : ''
            }`}
          />
          {fieldErrors.images && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.images}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Upload high-quality images showing all bundle contents together and individually</p>
          
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
          {loading && <Loader2 className="w-5 h-5 animate-spin text-Primarycolor" />}
          Create Bundle
        </button>
      </form>
    </div>
  );
}