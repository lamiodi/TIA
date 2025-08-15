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
  X,
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
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
    setEditingItem({ ...item, type });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setLoading(true);
      setError('');

      if (editingItem.type === 'product') {
        const { id, price, variants } = editingItem;
        await api.put(`/products/${id}`, {
          base_price: price,
          variants: variants,
        });
      } else {
        const { id, price } = editingItem;
        await api.put(`/bundles/${id}`, {
          bundle_price: price,
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
                          className="flex items-center"
                        >
                          {expandedItems[`product-${product.id}`] ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          )}
                          {product.name}
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
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Variants</h4>
                            {product.variants?.length > 0 ? (
                              <div className="space-y-4">
                                {product.variants.map((variant) => (
                                  <div
                                    key={`variant-${variant.id}`}
                                    className="border border-gray-200 rounded-lg p-4"
                                  >
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900">{variant.color_name}</p>
                                        <p className="text-sm text-gray-500">{variant.sku}</p>
                                      </div>
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
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
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
                          className="flex items-center"
                        >
                          {expandedItems[`bundle-${bundle.id}`] ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          )}
                          {bundle.name}
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-900">Edit {editingItem.type}</h4>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
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
                  <div className="space-y-4">
                    {editingItem.variants.map((variant) => (
                      <div
                        key={`edit-variant-${variant.id}`}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <p className="font-medium text-gray-900">{variant.color_name}</p>
                        <div className="mt-2 space-y-2">
                          {variant.sizes?.map((size) => (
                            <div
                              key={`edit-size-${variant.id}-${size.size_id}`}
                              className="flex items-center"
                            >
                              <span className="w-20 text-sm text-gray-600">{size.size_name}:</span>
                              <input
                                type="number"
                                min="0"
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
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