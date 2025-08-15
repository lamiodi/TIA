import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Package, ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const UserOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedImages, setSelectedImages] = useState({});
  
  // Fetch orders on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError('');
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/users/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
        // Check for orderId in URL params
        const orderId = searchParams.get('orderId');
        if (orderId) {
          const order = response.data.find((order) => order.id === parseInt(orderId));
          setSelectedOrder(order || null);
        }
      } catch (error) {
        setOrdersError(error.response?.data?.error || 'Failed to fetch orders');
        toast.error('Failed to fetch orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate, searchParams]);
  
  // Handle image navigation
  const handleImageChange = (itemId, index) => {
    setSelectedImages((prev) => ({ ...prev, [itemId]: index }));
  };
  
  // Format currency
  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
    } else if (currency === 'USD') {
      const totalAmount = amount > 1000 ? amount / 100 : amount;
      return `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return `${amount} ${currency}`;
  };
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Render image gallery
  const renderImageGallery = (images, itemId, productName) => {
    const imageArray = Array.isArray(images) ? images : images ? [images] : [];
    if (imageArray.length === 0) {
      return (
        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-xs font-Jost">No Image</span>
        </div>
      );
    }
    const currentImageIndex = selectedImages[itemId] || 0;
    const currentImage = imageArray[currentImageIndex];
    return (
      <div className="flex flex-col">
        <img
          src={currentImage}
          alt={productName}
          className="w-16 h-16 object-cover rounded-md border border-gray-200"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/100';
          }}
        />
        {imageArray.length > 1 && (
          <div className="flex mt-1 space-x-1">
            <button
              onClick={() => handleImageChange(itemId, (currentImageIndex - 1 + imageArray.length) % imageArray.length)}
              className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className="text-xs flex items-center px-1 font-Jost">
              {currentImageIndex + 1}/{imageArray.length}
            </span>
            <button
              onClick={() => handleImageChange(itemId, (currentImageIndex + 1) % imageArray.length)}
              className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-Manrope">My Orders</h1>
        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center font-Manrope">
              <Package className="h-5 w-5 mr-2" /> Order History
            </h2>
          </div>
          <div className="p-6">
            {ordersError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm text-red-700 font-Jost">{ordersError}</span>
              </div>
            )}
            {ordersLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-gray-600 text-center font-Jost">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-Jost">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-Jost">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-Jost">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-Jost">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-Jost">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-Jost">#{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-Jost">{formatDate(order.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-Jost">{formatCurrency(order.total, order.currency)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-Jost">
                          {order.payment_status}
                          {order.shipping_country !== 'Nigeria' && (
                            <span className="ml-2 font-Jost">
                              ({order.delivery_fee_paid ? 'Delivery Fee Paid' : 'Delivery Fee Pending'})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium font-Jost">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setSearchParams({ orderId: order.id });
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 font-Manrope">Order #{selectedOrder.id} Details</h2>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setSearchParams({});
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 font-Manrope">Order Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-gray-500 font-Jost">Order ID</p>
                      <p className="font-medium font-Jost">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-Jost">Reference</p>
                      <p className="font-medium font-Jost">{selectedOrder.reference}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-Jost">Total</p>
                      <p className="font-medium font-Jost">{formatCurrency(selectedOrder.total, selectedOrder.currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-Jost">Payment Status</p>
                      <p className={`font-medium ${selectedOrder.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'} font-Jost`}>
                        {selectedOrder.payment_status}
                      </p>
                    </div>
                    {selectedOrder.shipping_country !== 'Nigeria' && (
                      <div>
                        <p className="text-gray-500 font-Jost">Delivery Fee</p>
                        <p className={`font-medium ${selectedOrder.delivery_fee_paid ? 'text-green-600' : 'text-yellow-600'} font-Jost`}>
                          {selectedOrder.delivery_fee_paid ? formatCurrency(selectedOrder.delivery_fee, selectedOrder.currency) : 'Pending'}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 font-Jost">Shipping Country</p>
                      <p className="font-medium font-Jost">{selectedOrder.shipping_country}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-Jost">Order Date</p>
                      <p className="font-medium font-Jost">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                </div>
                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 font-Manrope">Shipping Address</h3>
                  {selectedOrder.shipping_address_title ? (
                    <div className="mt-2 text-sm text-gray-600 space-y-1 font-Jost">
                      <p>{selectedOrder.shipping_address_title}</p>
                      <p>{selectedOrder.shipping_address_line_1}</p>
                      {selectedOrder.shipping_address_landmark && <p>Landmark: {selectedOrder.shipping_address_landmark}</p>}
                      <p>
                        {selectedOrder.shipping_address_city}, {selectedOrder.shipping_address_state || ''}{' '}
                        {selectedOrder.shipping_address_zip_code}
                      </p>
                      <p>{selectedOrder.shipping_address_country}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500 font-Jost">No shipping address provided</p>
                  )}
                </div>
                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 font-Manrope">Billing Address</h3>
                  {selectedOrder.billing_address_full_name ? (
                    <div className="mt-2 text-sm text-gray-600 space-y-1 font-Jost">
                      <p>{selectedOrder.billing_address_full_name}</p>
                      <p>{selectedOrder.billing_address_line_1}</p>
                      <p>
                        {selectedOrder.billing_address_city}, {selectedOrder.billing_address_state || ''}{' '}
                        {selectedOrder.billing_address_zip_code}
                      </p>
                      <p>{selectedOrder.billing_address_country}</p>
                      <p>Email: {selectedOrder.billing_address_email}</p>
                      <p>Phone: {selectedOrder.billing_address_phone_number}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500 font-Jost">No billing address provided</p>
                  )}
                </div>
                {/* Items */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 font-Manrope">Items</h3>
                  <div className="mt-2 space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div key={item.id} className="flex items-start p-2 bg-gray-50 rounded">
                        {renderImageGallery([item.image_url], `order-item-${selectedOrder.id}-${item.id}`, item.product_name)}
                        <div className="flex-1 ml-4">
                          <p className="text-sm font-medium text-gray-900 font-Jost">{item.product_name}</p>
                          <div className="text-xs text-gray-600 space-y-1 font-Jost">
                            <p>Quantity: {item.quantity}</p>
                            <p>Price: {formatCurrency(item.price, selectedOrder.currency)}</p>
                            <p>Total: {formatCurrency(item.price * item.quantity, selectedOrder.currency)}</p>
                            {item.color_name && <p>Color: {item.color_name}</p>}
                            {item.size_name && <p>Size: {item.size_name}</p>}
                            {item.bundle_id && item.bundle_details && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 font-Jost">Bundle Contents:</p>
                                <ul className="pl-4 list-disc text-xs text-gray-600 font-Jost">
                                  {item.bundle_details.map((bundleItem, bIndex) => (
                                    <li key={bIndex} className="flex items-start mt-1">
                                      {renderImageGallery(
                                        [bundleItem.image_url],
                                        `bundle-item-${selectedOrder.id}-${item.id}-${bIndex}`,
                                        bundleItem.product_name
                                      )}
                                      <div className="ml-2">
                                        <span>{bundleItem.product_name}</span>
                                        {bundleItem.color_name && <span>, Color: {bundleItem.color_name}</span>}
                                        {bundleItem.size_name && <span>, Size: {bundleItem.size_name}</span>}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserOrders;