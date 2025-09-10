import React, { useState, useEffect } from 'react';
import { CreditCard, Save, X, User, Mail, Smartphone } from 'lucide-react';
import { countries } from '../utils/countries';

const BillingAddressForm = ({ 
  address, 
  onSubmit, 
  onCancel, 
  formErrors, 
  setFormErrors, 
  actionLoading,
  isGuest = false,
  guestData = null,
  userData = null
}) => {
  const { state, setState } = address;
  const [formData, setFormData] = useState({
    full_name: state.full_name || (guestData ? guestData.name : '') || (userData ? userData.name : ''),
    email: state.email || (guestData ? guestData.email : '') || (userData ? userData.email : ''),
    phone_number: state.phone_number || (guestData ? guestData.phone_number : ''),
    address_line_1: state.address_line_1 || '',
    // address_line_2 removed
    city: state.city || '',
    state: state.state || '',
    zip_code: state.zip_code || '',
    country: state.country || 'Nigeria',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      full_name: state.full_name || (guestData ? guestData.name : '') || (userData ? userData.name : ''),
      email: state.email || (guestData ? guestData.email : '') || (userData ? userData.email : ''),
      phone_number: state.phone_number || (guestData ? guestData.phone_number : ''),
      address_line_1: state.address_line_1 || '',
      // address_line_2 removed
      city: state.city || '',
      state: state.state || '',
      zip_code: state.zip_code || '',
      country: state.country || 'Nigeria',
    });
  }, [state, guestData, userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // For logged-in users, validate that userData exists and has required fields
    // For guest users, validate form fields directly
    if (isGuest || !userData) {
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    } else {
      // For logged-in users, ensure userData has required fields
      if (!userData.name || !userData.name.trim()) {
        newErrors.full_name = 'User name is required';
      }
      if (!userData.email || !userData.email.trim()) {
        newErrors.email = 'User email is required';
      }
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }
    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = 'Address line 1 is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // For guest users, ensure the email from guestData is included in the form data
      // For logged-in users, ensure userData name and email are included
      let finalFormData = formData;
      
      if (isGuest) {
        finalFormData = { ...formData, email: guestData.email };
      } else if (userData) {
        finalFormData = { 
          ...formData, 
          full_name: userData.name, 
          email: userData.email 
        };
      }
      
      setState(finalFormData);
      onSubmit(finalFormData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* For guest users, show pre-filled contact info that can't be edited */}
      {isGuest && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <User className="h-4 w-4 mr-2" /> Contact Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium">{formData.full_name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium">{formData.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Smartphone className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">{formData.phone_number}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            This information was provided during guest checkout and cannot be changed here.
          </p>
        </div>
      )}
      
      {/* For authenticated users, show editable contact fields */}
      {!isGuest && (
        <>
          {/* Only show Full Name and Email fields if userData is not available (for non-logged users) */}
          {!userData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full name"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Show user info for logged-in users */}
          {userData && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Full Name:</span>
                  <span className="ml-2 font-medium">{userData.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{userData.email}</span>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.phone_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Phone number"
            />
            {errors.phone_number && (
              <p className="text-sm text-red-600 mt-1">{errors.phone_number}</p>
            )}
          </div>
        </>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 *
        </label>
        <input
          type="text"
          name="address_line_1"
          value={formData.address_line_1}
          onChange={handleChange}
          className={`w-full p-2 border rounded-md ${
            errors.address_line_1 ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Street address, P.O. box"
        />
        {errors.address_line_1 && (
          <p className="text-sm text-red-600 mt-1">{errors.address_line_1}</p>
        )}
      </div>
      
      {/* Address Line 2 field removed */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="City"
          />
          {errors.city && (
            <p className="text-sm text-red-600 mt-1">{errors.city}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="State"
          />
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP/Postal Code
          </label>
          <input
            type="text"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="ZIP/Postal code"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.country ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-sm text-red-600 mt-1">{errors.country}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <X className="h-4 w-4 mr-1" /> Cancel
        </button>
        <button
          type="submit"
          disabled={actionLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
        >
          {actionLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" /> Save Address
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default BillingAddressForm;