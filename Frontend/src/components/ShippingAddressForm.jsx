import React, { useState, useEffect } from 'react';
import { MapPin, Save, X } from 'lucide-react';
import { countries } from '../utils/countries';

const ShippingAddressForm = ({ 
  address, 
  onSubmit, 
  onCancel,
  formErrors, 
  setFormErrors, 
  actionLoading,
  isGuest = false,
  guestData = null
}) => {
  const { state, setState } = address;
  const [formData, setFormData] = useState({
    title: state.title || 'Home',
    address_line_1: state.address_line_1 || '',
    address_line_2: state.address_line_2 || '',
    landmark: state.landmark || '',
    city: state.city || '',
    state: state.state || '',
    zip_code: state.zip_code || '',
    country: state.country || 'Nigeria',
    phone_number: state.phone_number || (guestData ? guestData.phone_number : '')
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      title: state.title || 'Home',
      address_line_1: state.address_line_1 || '',
      address_line_2: state.address_line_2 || '',
      landmark: state.landmark || '',
      city: state.city || '',
      state: state.state || '',
      zip_code: state.zip_code || '',
      country: state.country || 'Nigeria',
      phone_number: state.phone_number || (guestData ? guestData.phone_number : '')
    });
  }, [state, guestData]);

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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
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
    
    // Only validate phone number for authenticated users
    if (!isGuest && !formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setState(formData);
      onSubmit(formData);
      // The onSubmit function (handleShippingSubmit) will handle closing the form
      // by calling setShowShippingForm(false) after successful submission
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full p-2 border rounded-md ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Home, Office"
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title}</p>
        )}
      </div>
      
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
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2
        </label>
        <input
          type="text"
          name="address_line_2"
          value={formData.address_line_2}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Landmark
        </label>
        <input
          type="text"
          name="landmark"
          value={formData.landmark}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Nearby landmark (optional)"
        />
      </div>
      
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
      
      {/* Only show phone number field for authenticated users */}
      {!isGuest && (
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
      )}
      
      {/* For guest users, show a note that phone number is from guest form */}
      {isGuest && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            Using phone number from your guest information: {guestData?.phone_number}
          </p>
        </div>
      )}
      
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

export default ShippingAddressForm;