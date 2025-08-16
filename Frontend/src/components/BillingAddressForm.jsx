import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const BillingAddressForm = ({ 
  address, 
  onSubmit, 
  onCancel, 
  formErrors, 
  setFormErrors, 
  actionLoading,
  isEdit = false 
}) => {
  const { state: billingForm, setState: setBillingForm } = address;
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
      console.error('BillingAddressForm: Error decoding token:', err);
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
    if (!billingForm.full_name) errors.full_name = 'Full name is required';
    if (!billingForm.email) errors.email = 'Email is required';
    if (!billingForm.address_line_1) errors.address_line_1 = 'Address line 1 is required';
    if (!billingForm.city) errors.city = 'City is required';
    if (!billingForm.country) errors.country = 'Country is required';
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required billing address fields');
      return;
    }
    
    if (authLoading) {
      console.error('BillingAddressForm: Waiting for auth to load');
      toast.error('Authentication still loading, please wait.');
      return;
    }
    
    if (!isAuthenticated()) {
      toast.error('Please log in to add a billing address.');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const userId = getUserId();
      const payload = { 
        user_id: userId, 
        ...billingForm 
      };
      
      
      
      const token = getToken();
      const response = await axios.post(`${API_BASE_URL}/api/billing-addresses`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success(isEdit ? 'Billing address updated successfully' : 'Billing address added successfully');
      onSubmit(response.data);
    } catch (err) {
      console.error('BillingAddressForm: Error:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login', { state: { from: window.location.pathname } });
      } else {
        const errorMessage =
          err.response?.data?.details ||
          err.response?.data?.error ||
          err.message ||
          `Failed to ${isEdit ? 'update' : 'add'} billing address`;
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mt-4 p-6 bg-gray-50 rounded-lg border-gray-200">
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        {isEdit ? 'Edit Billing Address' : 'Add Billing Address'}
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            value={billingForm.full_name || ''}
            onChange={handleChange}
            className={`mt-1 block w-full text-sm border ${
              formErrors.full_name ? 'border-red-500' : 'border-gray-300'
            } rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900`}
            placeholder="e.g., John Doe"
            required
          />
          {formErrors.full_name && (
            <p className="text-sm text-red-600 mt-1">{formErrors.full_name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={billingForm.email || ''}
            onChange={handleChange}
            className={`mt-1 block w-full text-sm border ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900`}
            placeholder="e.g., john@example.com"
            required
          />
          {formErrors.email && (
            <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="text"
            name="phone_number"
            value={billingForm.phone_number || ''}
            onChange={handleChange}
            className={`mt-1 block w-full text-sm border ${
              formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
            } rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900`}
            placeholder="e.g., +2341234567890"
          />
          {formErrors.phone_number && (
            <p className="text-sm text-red-600 mt-1">{formErrors.phone_number}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500">
            Address Line 1
          </label>
          <input
            type="text"
            name="address_line_1"
            value={billingForm.address_line_1 || ''}
            onChange={handleChange}
            className={`mt-1 block w-full text-sm border ${
              formErrors.address_line_1 ? 'border-red-500' : 'border-gray-300'
            } rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900`}
            placeholder="Street Address"
            required
          />
          {formErrors.address_line_1 && (
            <p className="text-sm text-red-600 mt-1">{formErrors.address_line_1}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500">
            City
          </label>
          <input
            type="text"
            name="city"
            value={billingForm.city || ''}
            onChange={handleChange}
            className={`mt-1 block w-full text-sm border ${
              formErrors.city ? 'border-red-500' : 'border-gray-300'
            } rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900`}
            placeholder="e.g., Lagos"
            required
          />
          {formErrors.city && (
            <p className="text-sm text-red-600 mt-1">{formErrors.city}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            State (optional)
          </label>
          <input
            type="text"
            name="state"
            value={billingForm.state || ''}
            onChange={handleChange}
            className="mt-1 block w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900"
            placeholder="e.g., Lagos State"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Zip Code (optional)
          </label>
          <input
            type="text"
            name="zip_code"
            value={billingForm.zip_code || ''}
            onChange={handleChange}
            className={`mt-1 block w-full text-sm border ${
              formErrors.zip_code ? 'border-red-500' : 'border-gray-300'
            } rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900`}
            placeholder="e.g., 100001"
          />
          {formErrors.zip_code && (
            <p className="text-sm text-red-600 mt-1">{formErrors.zip_code}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500">
            Country
          </label>
          <select
            name="country"
            value={billingForm.country || 'Nigeria'}
            onChange={handleChange}
            className="mt-1 block w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-gray-900 focus:border-gray-900"
            required
          >
            <option value="Nigeria">Nigeria</option>
            <option value="United States">United States</option>
            <option value="France">France</option>
          </select>
          {formErrors.country && (
            <p className="text-sm text-red-600 mt-1">{formErrors.country}</p>
          )}
        </div>
        
        <div className="sm:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            className="w-full bg-gray-900 text-white text-sm py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isSubmitting || actionLoading}
          >
            {isSubmitting || actionLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                {isEdit ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Save Billing Address'
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-sm text-gray-600 hover:underline"
            disabled={isSubmitting || actionLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default BillingAddressForm;