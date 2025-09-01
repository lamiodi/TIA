// src/components/LoggedInUserAddresses.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, CreditCard, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import ShippingAddressForm from './ShippingAddressForm';
import BillingAddressForm from './BillingAddressForm';

const LoggedInUserAddresses = ({ 
  userId, 
  shippingAddresses, 
  setShippingAddresses, 
  billingAddresses, 
  setBillingAddresses,
  shippingAddressId, 
  setShippingAddressId,
  billingAddressId, 
  setBillingAddressId,
  billingAddressOption, 
  setBillingAddressOption,
  formErrors,
  setFormErrors,
  loading,
  setLoading
}) => {
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [editingShippingAddress, setEditingShippingAddress] = useState(null);
  const [editingBillingAddress, setEditingBillingAddress] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle shipping address submission
  const handleShippingSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const url = editingShippingAddress 
        ? `${API_BASE_URL}/api/addresses/${editingShippingAddress.id}`
        : `${API_BASE_URL}/api/addresses`;
      
      const method = editingShippingAddress ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          user_id: userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save shipping address');
      }
      
      const savedAddress = await response.json();
      
      // Update addresses list
      if (editingShippingAddress) {
        setShippingAddresses(prev => 
          prev.map(addr => addr.id === editingShippingAddress.id ? savedAddress : addr)
        );
      } else {
        setShippingAddresses(prev => [...prev, savedAddress]);
        // Set as selected if it's the first address
        if (shippingAddresses.length === 0) {
          setShippingAddressId(savedAddress.id);
        }
      }
      
      setSuccess('Shipping address saved successfully');
      setShowShippingForm(false);
      setEditingShippingAddress(null);
      
      // Reset form
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle billing address submission
  const handleBillingSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const url = editingBillingAddress 
        ? `${API_BASE_URL}/api/billing-addresses/${editingBillingAddress.id}`
        : `${API_BASE_URL}/api/billing-addresses`;
      
      const method = editingBillingAddress ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          user_id: userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save billing address');
      }
      
      const savedAddress = await response.json();
      
      // Update addresses list
      if (editingBillingAddress) {
        setBillingAddresses(prev => 
          prev.map(addr => addr.id === editingBillingAddress.id ? savedAddress : addr)
        );
      } else {
        setBillingAddresses(prev => [...prev, savedAddress]);
        // Set as selected if it's the first address
        if (billingAddresses.length === 0) {
          setBillingAddressId(savedAddress.id);
        }
      }
      
      setSuccess('Billing address saved successfully');
      setShowBillingForm(false);
      setEditingBillingAddress(null);
      
      // Reset form
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle address deletion
  const handleDeleteAddress = async (type, addressId) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/${type}/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete address');
      }
      
      if (type === 'addresses') {
        setShippingAddresses(prev => prev.filter(addr => addr.id !== addressId));
        if (shippingAddressId === addressId) {
          setShippingAddressId(shippingAddresses.length > 1 ? shippingAddresses[0].id : null);
        }
      } else {
        setBillingAddresses(prev => prev.filter(addr => addr.id !== addressId));
        if (billingAddressId === addressId) {
          setBillingAddressId(billingAddresses.length > 1 ? billingAddresses[0].id : null);
        }
      }
      
      setSuccess('Address deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit shipping address
  const handleEditShippingAddress = (address) => {
    setEditingShippingAddress(address);
    setShowShippingForm(true);
  };

  // Edit billing address
  const handleEditBillingAddress = (address) => {
    setEditingBillingAddress(address);
    setShowBillingForm(true);
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowShippingForm(false);
    setShowBillingForm(false);
    setEditingShippingAddress(null);
    setEditingBillingAddress(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-sm text-red-700 font-Jost">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-700 font-Jost">{success}</span>
        </div>
      )}
      
      {/* Shipping Address Section */}
      <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-Primarycolor font-Manrope flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Shipping Address
          </h3>
          <button
            onClick={() => {
              setEditingShippingAddress(null);
              setShowShippingForm(!showShippingForm);
            }}
            className="flex items-center text-sm bg-Primarycolor text-white px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> 
            {showShippingForm ? 'Cancel' : 'Add New'}
          </button>
        </div>
        
        {showShippingForm ? (
          <ShippingAddressForm
            address={{
              state: editingShippingAddress || {
                title: '',
                address_line_1: '',
                address_line_2: '',
                landmark: '',
                city: '',
                state: '',
                zip_code: '',
                country: 'Nigeria',
                phone_number: '',
              },
              setState: () => {} // We'll handle this in the form
            }}
            onSubmit={handleShippingSubmit}
            onCancel={handleCancelForm}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            actionLoading={loading}
            isGuest={false}
          />
        ) : (
          <>
            {shippingAddresses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 font-Jost">No shipping addresses found</p>
                <button
                  onClick={() => setShowShippingForm(true)}
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-Jost"
                >
                  Add your first address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {shippingAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      shippingAddressId === address.id
                        ? 'border-Primarycolor bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setShippingAddressId(address.id)}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="shippingAddress"
                          checked={shippingAddressId === address.id}
                          onChange={() => setShippingAddressId(address.id)}
                          className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3 mt-1"
                        />
                        <div>
                          <h4 className="font-medium text-Primarycolor font-Manrope">{address.title}</h4>
                          <p className="text-sm text-Accent font-Jost">
                            {address.address_line_1}
                            {address.address_line_2 && `, ${address.address_line_2}`}
                          </p>
                          <p className="text-sm text-Accent font-Jost">
                            {address.city}, {address.state} {address.zip_code}
                          </p>
                          <p className="text-sm text-Accent font-Jost">{address.country}</p>
                          {address.phone_number && (
                            <p className="text-sm text-Accent font-Jost">{address.phone_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditShippingAddress(address);
                          }}
                          className="p-2 text-gray-500 hover:text-Primarycolor"
                          title="Edit address"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this address?')) {
                              handleDeleteAddress('addresses', address.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-600"
                          title="Delete address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Billing Address Section */}
      <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-Primarycolor font-Manrope flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Billing Address
          </h3>
          <button
            onClick={() => {
              setEditingBillingAddress(null);
              setShowBillingForm(!showBillingForm);
            }}
            className="flex items-center text-sm bg-Primarycolor text-white px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> 
            {showBillingForm ? 'Cancel' : 'Add New'}
          </button>
        </div>
        
        {/* Billing Address Option Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="billingAddressOption"
                value="same"
                checked={billingAddressOption === 'same'}
                onChange={() => setBillingAddressOption('same')}
                className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
              />
              <span className="text-sm font-medium text-Accent font-Jost">Same as shipping address</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="billingAddressOption"
                value="different"
                checked={billingAddressOption === 'different'}
                onChange={() => setBillingAddressOption('different')}
                className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
              />
              <span className="text-sm font-medium text-Accent font-Jost">Use a different billing address</span>
            </label>
          </div>
        </div>
        
        {billingAddressOption === 'same' ? (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start">
              <div className="flex-1">
                <h4 className="font-medium text-Primarycolor font-Manrope mb-2">Billing Address (Same as Shipping)</h4>
                {shippingAddresses.find(addr => addr.id === shippingAddressId) ? (
                  <div className="text-sm text-Accent font-Jost">
                    <p>{shippingAddresses.find(addr => addr.id === shippingAddressId).address_line_1}</p>
                    {shippingAddresses.find(addr => addr.id === shippingAddressId).address_line_2 && (
                      <p>{shippingAddresses.find(addr => addr.id === shippingAddressId).address_line_2}</p>
                    )}
                    <p>
                      {shippingAddresses.find(addr => addr.id === shippingAddressId).city}, 
                      {shippingAddresses.find(addr => addr.id === shippingAddressId).state} 
                      {shippingAddresses.find(addr => addr.id === shippingAddressId).zip_code}
                    </p>
                    <p>{shippingAddresses.find(addr => addr.id === shippingAddressId).country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 font-Jost">Please select a shipping address first</p>
                )}
              </div>
            </div>
          </div>
        ) : showBillingForm ? (
          <BillingAddressForm
            address={{
              state: editingBillingAddress || {
                full_name: '',
                email: '',
                phone_number: '',
                address_line_1: '',
                address_line_2: '',
                city: '',
                state: '',
                zip_code: '',
                country: 'Nigeria',
              },
              setState: () => {} // We'll handle this in the form
            }}
            onSubmit={handleBillingSubmit}
            onCancel={handleCancelForm}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            actionLoading={loading}
            isGuest={false}
          />
        ) : (
          <>
            {billingAddresses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 font-Jost">No billing addresses found</p>
                <button
                  onClick={() => setShowBillingForm(true)}
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-Jost"
                >
                  Add your first address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {billingAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      billingAddressId === address.id
                        ? 'border-Primarycolor bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setBillingAddressId(address.id)}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="billingAddress"
                          checked={billingAddressId === address.id}
                          onChange={() => setBillingAddressId(address.id)}
                          className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3 mt-1"
                        />
                        <div>
                          <h4 className="font-medium text-Primarycolor font-Manrope">{address.full_name}</h4>
                          <p className="text-sm text-Accent font-Jost">{address.email}</p>
                          <p className="text-sm text-Accent font-Jost">
                            {address.address_line_1}
                            {address.address_line_2 && `, ${address.address_line_2}`}
                          </p>
                          <p className="text-sm text-Accent font-Jost">
                            {address.city}, {address.state} {address.zip_code}
                          </p>
                          <p className="text-sm text-Accent font-Jost">{address.country}</p>
                          {address.phone_number && (
                            <p className="text-sm text-Accent font-Jost">{address.phone_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBillingAddress(address);
                          }}
                          className="p-2 text-gray-500 hover:text-Primarycolor"
                          title="Edit address"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this address?')) {
                              handleDeleteAddress('billing-addresses', address.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-600"
                          title="Delete address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoggedInUserAddresses;