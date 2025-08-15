import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ShippingAddressForm = ({ 
  address, 
  onSubmit, 
  onCancel, 
  formErrors, 
  setFormErrors, 
  actionLoading 
}) => {
  const { state: shippingForm, setState: setShippingForm } = address;
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('ShippingAddressForm: Error decoding token:', err);
      return null;
    }
  };
  
  // Helper function to get the JWT token
  const getToken = () => {
    // First try to get token from user object
    if (user && user.token) {
      return user.token;
    }
    
    // If not in user object, get from localStorage
    return localStorage.getItem('token');
  };
  
  // Helper function to get user ID
  const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    
    // Decode token to get ID
    const tokenData = decodeToken(token);
    return tokenData?.id;
  };
  
  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    const token = getToken();
    return !!token; // Just check if token exists
  };
  
  const validateForm = () => {
    const errors = {};
    if (!shippingForm.title) errors.title = 'Title is required';
    if (!shippingForm.address_line_1) errors.address_line_1 = 'Address line 1 is required';
    if (!shippingForm.city) errors.city = 'City is required';
    if (!shippingForm.country) errors.country = 'Country is required';
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required shipping address fields');
      return;
    }
    
    if (authLoading) {
      console.error('ShippingAddressForm: Waiting for auth to load');
      toast.error('Authentication still loading, please wait.');
      return;
    }
    
    if (!isAuthenticated()) {
      toast.error('Please log in to add a shipping address.');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Include phone_number and landmark in the payload
      const payload = {
        user_id: getUserId(),
        title: shippingForm.title,
        address_line_1: shippingForm.address_line_1,
        address_line_2: shippingForm.address_line_2 || '',
        landmark: shippingForm.landmark || '',
        city: shippingForm.city,
        state: shippingForm.state || '',
        zip_code: shippingForm.zip_code || '',
        country: shippingForm.country,
        phone_number: shippingForm.phone_number || ''
      };
      
      console.log('ShippingAddressForm: Sending shipping address:', payload);
      
      const token = getToken();
      const response = await axios.post(`${API_BASE_URL}/api/addresses`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success('Shipping address saved successfully');
      onSubmit(response.data);
    } catch (err) {
      console.error('ShippingAddressForm: Error:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login', { state: { from: window.location.pathname } });
      } else {
        const errorMessage =
          err.response?.data?.details ||
          err.response?.data?.error ||
          err.message ||
          'Failed to save shipping address';
        toast.error(`Failed to save shipping address: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={shippingForm.title || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="e.g., Home, Office"
        />
        {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
        <input
          type="text"
          name="address_line_1"
          value={shippingForm.address_line_1 || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Street address"
        />
        {formErrors.address_line_1 && <p className="text-sm text-red-600">{formErrors.address_line_1}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
        <input
          type="text"
          name="address_line_2"
          value={shippingForm.address_line_2 || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Landmark</label>
        <input
          type="text"
          name="landmark"
          value={shippingForm.landmark || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Nearby landmark (optional)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">City</label>
        <input
          type="text"
          name="city"
          value={shippingForm.city || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="City"
        />
        {formErrors.city && <p className="text-sm text-red-600">{formErrors.city}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">State</label>
        <input
          type="text"
          name="state"
          value={shippingForm.state || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="State/Province"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Zip Code</label>
        <input
          type="text"
          name="zip_code"
          value={shippingForm.zip_code || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Postal/Zip code"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Country</label>
        <input
          type="text"
          name="country"
          value={shippingForm.country || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Country"
        />
        {formErrors.country && <p className="text-sm text-red-600">{formErrors.country}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="text"
          name="phone_number"
          value={shippingForm.phone_number || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Phone number"
        />
      </div>
      
      <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center"
          disabled={isSubmitting || actionLoading}
        >
          {isSubmitting || actionLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-300"
          disabled={isSubmitting || actionLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ShippingAddressForm;