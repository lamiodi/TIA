// src/components/ShippingAddressForm.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, X, Save } from 'lucide-react';

const ShippingAddressForm = ({ 
  address, 
  onSubmit, 
  onCancel, 
  formErrors, 
  setFormErrors, 
  actionLoading,
  isGuest // Add this prop
}) => {
  const { state: shippingForm, setState: setShippingForm } = address;
  const [formData, setFormData] = useState({
    title: shippingForm.title || '',
    address_line_1: shippingForm.address_line_1 || '',
    address_line_2: shippingForm.address_line_2 || '',
    landmark: shippingForm.landmark || '',
    city: shippingForm.city || '',
    state: shippingForm.state || '',
    zip_code: shippingForm.zip_code || '',
    country: shippingForm.country || 'Nigeria',
    phone_number: shippingForm.phone_number || '', // Will be hidden for guest users
  });

  useEffect(() => {
    setFormData({
      title: shippingForm.title || '',
      address_line_1: shippingForm.address_line_1 || '',
      address_line_2: shippingForm.address_line_2 || '',
      landmark: shippingForm.landmark || '',
      city: shippingForm.city || '',
      state: shippingForm.state || '',
      zip_code: shippingForm.zip_code || '',
      country: shippingForm.country || 'Nigeria',
      phone_number: shippingForm.phone_number || '',
    });
  }, [shippingForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setShippingForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.address_line_1.trim()) errors.address_line_1 = 'Address line 1 is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.country.trim()) errors.country = 'Country is required';
    
    // Only validate phone number if user is not a guest
    if (!isGuest && !formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md font-Jost ${
              formErrors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Home, Office"
          />
          {formErrors.title && (
            <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.title}</p>
          )}
        </div>
        
        {/* Only show phone number field if user is not a guest */}
        {!isGuest && (
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md font-Jost ${
                formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
            {formErrors.phone_number && (
              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.phone_number}</p>
            )}
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-Accent mb-1 font-Jost flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          Address Line 1 *
        </label>
        <input
          type="text"
          name="address_line_1"
          value={formData.address_line_1}
          onChange={handleChange}
          className={`w-full p-2 border rounded-md font-Jost ${
            formErrors.address_line_1 ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Street address, P.O. box, company name"
        />
        {formErrors.address_line_1 && (
          <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.address_line_1}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
          Address Line 2
        </label>
        <input
          type="text"
          name="address_line_2"
          value={formData.address_line_2}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
          Landmark
        </label>
        <input
          type="text"
          name="landmark"
          value={formData.landmark}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Nearby landmark (optional)"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md font-Jost ${
              formErrors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="City"
          />
          {formErrors.city && (
            <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.city}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
            State
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md font-Jost"
            placeholder="State/Province/Region"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
            ZIP Code
          </label>
          <input
            type="text"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md font-Jost"
            placeholder="ZIP/Postal code"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
          Country *
        </label>
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          className={`w-full p-2 border rounded-md font-Jost ${
            formErrors.country ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="Nigeria">Nigeria</option>
          <option value="United States">United States</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Canada">Canada</option>
          <option value="Australia">Australia</option>
          <option value="Germany">Germany</option>
          <option value="France">France</option>
          <option value="Other">Other</option>
        </select>
        {formErrors.country && (
          <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.country}</p>
        )}
      </div>
      
      {onSubmit && onCancel && (
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-Accent hover:bg-gray-50 flex items-center font-Jost"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-4 py-2 bg-Primarycolor text-white rounded-md hover:bg-gray-800 flex items-center disabled:opacity-50 font-Jost"
          >
            {actionLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save Address
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
};

export default ShippingAddressForm;