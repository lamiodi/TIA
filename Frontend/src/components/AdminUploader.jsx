import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle, Info } from 'lucide-react';

// Define API_BASE_URL with proper endpoint handling
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}` 
  : 'https://tia-backend-r331.onrender.com';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default function AdminUploader() {
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    sku_prefix: '',
    is_new_release: false,
    category: '',
    gender: '',
    variants: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        // Use the correct endpoint paths with /api prefix
        const [colorRes, sizeRes] = await Promise.all([
          api.get('/api/meta/colors'),
          api.get('/api/meta/sizes'),
        ]);
        setColors(colorRes.data);
        setSizes(sizeRes.data);
      } catch (err) {
        console.error('Error fetching meta data:', err);
        setError('Failed to load colors and sizes');
      }
    };
    fetchMeta();
  }, []);

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: '',
          color_id: '',
          color_code: '',
          sizes: sizes.map((s) => ({
            size_id: s.id,
            size_code: s.size_code,
            stock_quantity: 0,
          })),
          images: [],
          previews: [],
        },
      ],
    }));
  };

  const updateVariantField = (index, field, value) => {
    const updated = [...form.variants];
    if (field === 'color_id') {
      const parsedId = parseInt(value);
      updated[index].color_id = parsedId;
      const selectedColor = colors.find((c) => c.id === parsedId);
      updated[index].color_code = selectedColor?.color_code || '';
    } else {
      updated[index][field] = value;
    }
    setForm((prev) => ({ ...prev, variants: updated }));
  };

  const updateSizeStock = (variantIndex, sizeIndex, value) => {
    const updated = [...form.variants];
    updated[variantIndex].sizes[sizeIndex].stock_quantity = parseInt(value) || 0;
    setForm((prev) => ({ ...prev, variants: updated }));
  };

  const handleVariantImageChange = (index, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Each color variant can have a maximum of 5 images.');
      return;
    }
    const updated = [...form.variants];
    updated[index].images = files;
    updated[index].previews = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, variants: updated }));
  };

  const removeVariantImage = (variantIndex, imgIndex) => {
    const updated = [...form.variants];
    const img = updated[variantIndex];
    URL.revokeObjectURL(img.previews[imgIndex]);
    img.images.splice(imgIndex, 1);
    img.previews.splice(imgIndex, 1);
    setForm((prev) => ({ ...prev, variants: updated }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.name.trim()) {
      errors.name = 'Product name is required';
    } else if (form.name.length < 3) {
      errors.name = 'Product name must be at least 3 characters long';
    }
    
    if (!form.description.trim()) {
      errors.description = 'Product description is required';
    } else if (form.description.length < 10) {
      errors.description = 'Description should be at least 10 characters for better customer understanding';
    }
    
    if (!form.base_price || form.base_price <= 0) {
      errors.base_price = 'Please enter a valid price greater than 0';
    }
    
    if (!form.sku_prefix) {
      errors.sku_prefix = 'SKU prefix is required';
    } else if (form.sku_prefix.length !== 3) {
      errors.sku_prefix = 'SKU prefix must be exactly 3 characters';
    }
    
    if (!form.category) {
      errors.category = 'Please select a category for your product';
    }
    
    if (!form.gender) {
      errors.gender = 'Please specify the target gender for this product';
    }
    
    if (form.variants.length === 0) {
      errors.variants = 'Please add at least one product variant';
    } else {
      form.variants.forEach((variant, index) => {
        if (!variant.name.trim()) {
          errors[`variant_${index}_name`] = `Variant ${index + 1} name is required`;
        }
        if (!variant.color_id) {
          errors[`variant_${index}_color`] = `Variant ${index + 1} color is required`;
        }
        if (variant.images.length === 0) {
          errors[`variant_${index}_images`] = `Variant ${index + 1} must have at least one image`;
        }
        const hasStock = variant.sizes.some(s => s.stock_quantity > 0);
        if (!hasStock) {
          errors[`variant_${index}_stock`] = `Variant ${index + 1} must have stock in at least one size`;
        }
      });
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setFieldErrors({});
    setLoading(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the validation errors below');
      setLoading(false);
      return;
    }

    for (const [index, variant] of form.variants.entries()) {
      if (!variant.color_id || !variant.color_code) {
        setError(`Each variant must have a selected color.`);
        setLoading(false);
        return;
      }
      if (variant.images.length < 1 || variant.images.length > 5) {
        setError('Each variant must have 1 to 5 images.');
        setLoading(false);
        return;
      }
    }

    const hasStock = form.variants.some((v) =>
      v.sizes.some((s) => s.stock_quantity > 0)
    );
    if (!hasStock) {
      setError('At least one size must have stock.');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      const payload = {
        ...form,
        variants: form.variants.map((v) => ({
          name: v.name,
          color_id: v.color_id,
          color_code: v.color_code,
          sizes: v.sizes,
        })),
      };
      data.append('data', JSON.stringify(payload));
      form.variants.forEach((variant, i) => {
        variant.images.forEach((img) => data.append(`images_${i}`, img));
      });

      // Use the correct endpoint path with /api prefix
      await api.post('/api/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setForm({
        name: '',
        description: '',
        base_price: '',
        sku_prefix: '',
        is_new_release: false,
        category: '',
        gender: '',
        variants: [],
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        console.error('Error config:', err.config);
        setError(err.response?.data?.error || `Upload failed with status ${err.response.status}`);
      } else {
        setError('Upload failed: Network error or server is down');
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Product</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Product uploaded successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Product Name
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Enter a clear, descriptive product name (e.g., "Cotton Casual T-Shirt")
              </div>
            </div>
          </label>
          <input
            type="text"
            required
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter product name (e.g., Cotton Casual T-Shirt)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">This will be displayed as the main product title to customers</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Description
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Detailed product description including features, materials, and care instructions
              </div>
            </div>
          </label>
          <textarea
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Describe the product features, materials, fit, and care instructions..."
            rows="4"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Include key features, materials, sizing info, and care instructions</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Base Price (NGN)
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Starting price in Nigerian Naira (variants may have different prices)
              </div>
            </div>
          </label>
          <input
            type="number"
            step="0.01"
            required
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.base_price ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter base price (e.g., 15000)"
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: e.target.value })}
          />
          {fieldErrors.base_price && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.base_price}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Base price for the product - individual variants can have adjusted prices</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            SKU Prefix
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                3-letter code for inventory tracking (e.g., TSH for T-Shirts, DRS for Dresses)
              </div>
            </div>
          </label>
          <input
            type="text"
            required
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.sku_prefix ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter 3-letter SKU prefix (e.g., TSH, DRS, JKT)"
            value={form.sku_prefix}
            onChange={(e) => setForm({ ...form, sku_prefix: e.target.value.toUpperCase() })}
            maxLength="3"
          />
          {fieldErrors.sku_prefix && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.sku_prefix}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Used for generating unique product codes (automatically converted to uppercase)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Category
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Select the main product category for proper organization
              </div>
            </div>
          </label>
          <select
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select Category</option>
            <option value="Gymwears">Gymwears</option>
            <option value="Briefs">Briefs</option>
            <option value="Sets">Sets</option>
           
          </select>
          {fieldErrors.category && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.category}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Choose the category that best describes this product type</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Gender
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Target gender for this product (affects filtering and recommendations)
              </div>
            </div>
          </label>
          <select
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unisex">Unisex</option>
          </select>
          {fieldErrors.gender && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.gender}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Select the target gender or choose Unisex for gender-neutral products</p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="newRelease"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={form.is_new_release}
              onChange={(e) => setForm({ ...form, is_new_release: e.target.checked })}
            />
            <label htmlFor="newRelease" className="text-sm text-gray-700 flex items-center gap-2">
              Mark as New Release
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Mark as new release to feature in "New Arrivals" section
                </div>
              </div>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-7">Check this box to highlight the product as a new arrival</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Create different versions of your product (colors, styles, etc.)
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Add different color variants and their available sizes with stock quantities</p>
          {form.variants.map((variant, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Variant Name
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Descriptive name for this variant (e.g., "Ocean Blue", "Midnight Black")
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Classic Blue, Sunset Red, Midnight Black"
                    value={variant.name || ''}
                    onChange={(e) => updateVariantField(i, 'name', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Give this variant a unique, descriptive name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Color
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Select the primary color for this variant
                      </div>
                    </div>
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={variant.color_id || ''}
                    onChange={(e) => updateVariantField(i, 'color_id', e.target.value)}
                  >
                    <option value="">-- Select Color --</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.color_name} ({c.color_code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose the color that best represents this variant</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    Stock for Each Size
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Enter available stock quantity for each size
                      </div>
                    </div>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {variant.sizes.map((sz, sIdx) => (
                      <div key={sIdx}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {sizes.find((s) => s.id === sz.size_id)?.size_name || 'Unknown Size'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Stock qty"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={sz.stock_quantity}
                          onChange={(e) => updateSizeStock(i, sIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter 0 for out-of-stock sizes, leave empty if size not available</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Images (Max 5)
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Upload high-quality images showing this specific variant
                      </div>
                    </div>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleVariantImageChange(i, e)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload clear, high-resolution images (JPG, PNG) showing this color variant</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {variant.previews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={src}
                          alt={`preview-${idx}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(i, idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addVariant}
            className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            + Add Variant
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {loading && <Loader2 className="w-5 h-5 text-Primarycolor animate-spin" />}
          {loading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
    </div>
  );
}