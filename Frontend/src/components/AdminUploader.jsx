import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com/api';
const api = axios.create({ baseURL: API_BASE_URL });

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [colorRes, sizeRes] = await Promise.all([
          api.get('/api/meta/colors'),
          api.get('/api/meta/sizes'),
        ]);
        setColors(colorRes.data);
        setSizes(sizeRes.data);
      } catch (err) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

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

      await api.post('/products', data, {
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
      console.error(err);
      setError(err.response?.data?.error || 'Upload failed');
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter product description"
            rows="4"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (NGN)</label>
          <input
            type="number"
            step="0.01"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter base price"
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU Prefix</label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter SKU prefix"
            value={form.sku_prefix}
            onChange={(e) => setForm({ ...form, sku_prefix: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select Category</option>
            <option value="Gymwears">Gymwears</option>
            <option value="Briefs">Briefs</option>
            <option value="Sets">Sets</option>
            <option value="Tops">Tops</option>
            <option value="Bottoms">Bottoms</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="newRelease"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={form.is_new_release}
            onChange={(e) => setForm({ ...form, is_new_release: e.target.checked })}
          />
          <label htmlFor="newRelease" className="text-sm text-gray-700">Mark as New Release</label>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Variants</h3>
          {form.variants.map((variant, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter variant name"
                    value={variant.name || ''}
                    onChange={(e) => updateVariantField(i, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock for Each Size
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {variant.sizes.map((sz, sIdx) => (
                      <div key={sIdx}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {sizes.find((s) => s.id === sz.size_id)?.size_name || sz.size_code}
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={sz.stock_quantity}
                          onChange={(e) => updateSizeStock(i, sIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images (Max 5)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleVariantImageChange(i, e)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
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
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
    </div>
  );
}