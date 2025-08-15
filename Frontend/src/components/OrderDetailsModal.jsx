import { 
  XCircle, User, Mail, Phone, Calendar, Globe, MapPin, Package, CreditCard, 
  ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon, 
  Printer, CheckCircle, Send, Trash2
} from 'lucide-react';

const OrderDetailsModal = ({
  selectedOrder,
  showOrderDetail,
  setShowOrderDetail,
  orderDetails,
  detailsLoading,
  selectedImages,
  handleImageChange,
  formatCurrency,
  getStatusIcon,
  formatDate,
  onUpdateStatus,
  onDeleteOrder,
  onMarkAsPacked,
  onSendEmail
}) => {
  if (!selectedOrder || !showOrderDetail) return null;
  const details = orderDetails[selectedOrder.id] || {};
  const user = details.user || {};
  const shippingAddress = details.shippingAddress || {};
  const billingAddress = details.billingAddress || {};
  const items = details.items || [];
  const bundleItems = details.bundleItems || [];
  const order = details.order || {};
  const orderData = { ...selectedOrder, ...order };

  const renderImageGallery = (images, itemId, productName) => {
    const imageArray = Array.isArray(images) ? images : (images ? [images] : []);
    if (imageArray.length === 0) {
      return (
        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Image</span>
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
          onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
        />
        {imageArray.length > 1 && (
          <div className="flex mt-1 space-x-1">
            <button 
              onClick={() => handleImageChange(itemId, (currentImageIndex - 1 + imageArray.length) % imageArray.length)} 
              className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <ChevronLeftIcon className="w-3 h-3" />
            </button>
            <span className="text-xs flex items-center px-1">{currentImageIndex + 1}/{imageArray.length}</span>
            <button 
              onClick={() => handleImageChange(itemId, (currentImageIndex + 1) % imageArray.length)} 
              className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const handlePrintPackingList = () => {
    const printContent = document.getElementById('packing-checklist').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Packing List - Order #${selectedOrder.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .bundle { margin-left: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Packing List</h1>
            <h2>Order #${selectedOrder.id}</h2>
            <p>${user.first_name || ''} ${user.last_name || ''}</p>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Order Details - #{selectedOrder.id}</h2>
            <button onClick={() => setShowOrderDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {detailsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" /> Customer Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><User className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{user.first_name || orderData.first_name} {user.last_name || orderData.last_name}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Mail className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{user.email || orderData.user_email}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Phone className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{user.phone_number || orderData.phone_number || 'N/A'}</p></div>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2" /> Order Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Calendar className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Order Date</p><p className="font-medium">{formatDate(orderData.created_at)}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">{getStatusIcon(orderData.status)}</div>
                    <div><p className="text-sm text-gray-500">Status</p><p className="font-medium capitalize">{orderData.status}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><CreditCard className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Payment Method</p><p className="font-medium">{orderData.payment_method || 'N/A'}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><CreditCard className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Payment Status</p><p className="font-medium capitalize">{orderData.payment_status}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Globe className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Reference</p><p className="font-medium">{orderData.reference}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Globe className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Shipping Country</p><p className="font-medium">{orderData.shipping_country || 'N/A'}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Globe className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Shipping Method</p><p className="font-medium">{orderData.shipping_method || 'N/A'}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><CreditCard className="w-5 h-5 text-blue-600" /></div>
                    <div>
                      <p className="text-sm text-gray-500">Delivery Fee</p>
                      <p className="font-medium">
                        {orderData.delivery_fee ? 
                          `${formatCurrency(orderData.delivery_fee, 'USD')} (${orderData.delivery_fee_paid ? 'Paid' : 'Pending'})` : 
                          'Not Set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="text-lg font-semibold text-green-600">{formatCurrency(orderData.total, orderData.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" /> Shipping Address
                </h3>
                {shippingAddress.id ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{shippingAddress.title || 'Default'}</p>
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">{shippingAddress.country || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-1 mt-0.5 text-gray-500 flex-shrink-0" />
                        <div>
                          <div>{shippingAddress.address_line_1}</div>
                          {shippingAddress.landmark && <div>Landmark: {shippingAddress.landmark}</div>}
                          <div>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}</div>
                          <div>{shippingAddress.country || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">Shipping address not available.</div>
                )}
              </div>

              {/* Billing Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" /> Billing Address
                </h3>
                {billingAddress.id ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{billingAddress.full_name || 'Default'}</p>
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">{billingAddress.country || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-1 mt-0.5 text-gray-500 flex-shrink-0" />
                        <div>
                          <div>{billingAddress.address_line_1}</div>
                          {billingAddress.landmark && <div>Landmark: {billingAddress.landmark}</div>}
                          <div>{billingAddress.city}, {billingAddress.state} {billingAddress.zip_code}</div>
                          <div>{billingAddress.country || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">Billing address not available.</div>
                )}
              </div>

              {/* Packing Checklist */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="w-5 h-5 mr-2" /> Packing Checklist
                  </h3>
                  <button onClick={handlePrintPackingList} className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors">
                    <Printer className="w-4 h-4 mr-1" /> Print
                  </button>
                </div>
                <div id="packing-checklist" className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-4">Items to pack for order #{selectedOrder.id}</p>
                  {items.length === 0 && bundleItems.length === 0 ? (
                    <div className="text-center py-4"><p className="text-sm text-gray-500">No items found for this order.</p></div>
                  ) : (
                    <>
                      {items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Products</h4>
                          <div className="space-y-2">
                            {items.map(item => (
                              <div key={item.id} className="flex items-start p-3 border border-gray-200 rounded-lg bg-white">
                                {renderImageGallery(item.images, `item-${item.id}`, item.product_name)}
                                <div className="flex-1 ml-4">
                                  <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p><span className="font-medium">Item ID:</span> {item.id}</p>
                                    <p><span className="font-medium">Variant ID:</span> {item.variant_id || 'N/A'}</p>
                                    <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
                                    {item.color_name && (
                                      <p className="flex items-center">
                                        <span className="font-medium">Color:</span> 
                                        <span className="ml-1 inline-block w-3 h-3 rounded-full border border-gray-300" 
                                              style={{ backgroundColor: getColorCode(item.color_name) }}></span>
                                        <span className="ml-1">{item.color_name}</span>
                                      </p>
                                    )}
                                    {item.size_name && <p><span className="font-medium">Size:</span> {item.size_name}</p>}
                                    <p><span className="font-medium">Price:</span> {formatCurrency(item.price, orderData.currency)}</p>
                                  </div>
                                </div>
                                <div className="ml-4"><input type="checkbox" className="h-5 w-5 text-green-600" /></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {bundleItems.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Bundles</h4>
                          <div className="space-y-2">
                            {bundleItems.map(bundle => (
                              <div key={bundle.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="flex items-start">
                                  {renderImageGallery(bundle.images, `bundle-${bundle.id}`, bundle.bundle_name)}
                                  <div className="flex-1 ml-4">
                                    <p className="text-sm font-medium text-gray-900">{bundle.bundle_name}</p>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      <p><span className="font-medium">Bundle ID:</span> {bundle.bundle_id}</p>
                                      <p><span className="font-medium">Order Item ID:</span> {bundle.id}</p>
                                      <p><span className="font-medium">Quantity:</span> {bundle.quantity}</p>
                                      <p><span className="font-medium">Price:</span> {formatCurrency(bundle.price, orderData.currency)}</p>
                                    </div>
                                  </div>
                                  <div className="ml-4"><input type="checkbox" className="h-5 w-5 text-green-600" /></div>
                                </div>
                                {bundle.bundle_items?.length > 0 && (
                                  <div className="mt-3 pl-6">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Bundle Contents:</p>
                                    <div className="space-y-2">
                                      {bundle.bundle_items.map((item, index) => (
                                        <div key={index} className="flex items-start p-2 bg-gray-100 rounded">
                                          {renderImageGallery(item.images, `bundle-item-${bundle.id}-${index}`, item.product_name)}
                                          <div className="flex-1 ml-4">
                                            <p className="text-xs font-medium text-gray-900">{item.product_name}</p>
                                            <div className="text-xs text-gray-600 space-y-1">
                                              <p><span className="font-medium">Product ID:</span> {item.product_id || 'N/A'}</p>
                                              {item.color_name && (
                                                <p className="flex items-center">
                                                  <span className="font-medium">Color:</span> 
                                                  <span className="ml-1 inline-block w-3 h-3 rounded-full border border-gray-300" 
                                                        style={{ backgroundColor: getColorCode(item.color_name) }}></span>
                                                  <span className="ml-1">{item.color_name}</span>
                                                </p>
                                              )}
                                              {item.size_name && <p><span className="font-medium">Size:</span> {item.size_name}</p>}
                                            </div>
                                          </div>
                                          <div className="ml-4"><input type="checkbox" className="h-5 w-5 text-green-600" /></div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            {orderData.status === 'pending' && (
              <button onClick={onMarkAsPacked} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Mark as Packed
              </button>
            )}
            <button onClick={onSendEmail} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
              <Send className="w-4 h-4 mr-1" /> Send Email
            </button>
            <button onClick={onUpdateStatus} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Update Status
            </button>
            {orderData.status === 'delivered' && (
              <button onClick={onDeleteOrder} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center">
                <Trash2 className="w-4 h-4 mr-1" /> Delete Order
              </button>
            )}
            <button onClick={() => setShowOrderDetail(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getColorCode = (colorName) => {
  const colorMap = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Gray': '#808080',
    'Blue': '#0000FF',
    'Brown': '#A52A2A',
    'Cream': '#FFFDD0',
    'Pink': '#FFC0CB',
    'BLK': '#000000',
    'WHT': '#FFFFFF',
    'GRY': '#808080',
    'BLU': '#0000FF',
    'BRN': '#A52A2A',
    'CRM': '#FFFDD0',
    'PNK': '#FFC0CB'
  };
  return colorMap[colorName] || '#CCCCCC';
};

export default OrderDetailsModal;