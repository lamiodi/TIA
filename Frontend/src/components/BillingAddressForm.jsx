// src/components/BillingAddressForm.jsx
import React from 'react';
import { MapPin, Phone, Mail, User, X, Save } from 'lucide-react';

const BillingAddressForm = ({ 
  address, 
  onSubmit, 
  onCancel, 
  formErrors, 
  setFormErrors, 
  actionLoading
}) => {
  const { state: billingForm, setState: setBillingForm } = address;
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!billingForm.full_name?.trim()) errors.full_name = 'Full name is required';
    if (!billingForm.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(billingForm.email)) {
      errors.email = 'Email is invalid';
    }
    if (!billingForm.phone_number?.trim()) errors.phone_number = 'Phone number is required';
    if (!billingForm.address_line_1?.trim()) errors.address_line_1 = 'Address line 1 is required';
    if (!billingForm.city?.trim()) errors.city = 'City is required';
    if (!billingForm.country?.trim()) errors.country = 'Country is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form
    if (onSubmit) {
      onSubmit(billingForm);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-Accent mb-1 font-Jost flex items-center">
            <User className="h-4 w-4 mr-1" />
            Full Name *
          </label>
          <input
            type="text"
            name="full_name"
            value={billingForm.full_name || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md font-Jost ${
              formErrors.full_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., John Doe"
          />
          {formErrors.full_name && (
            <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.full_name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-Accent mb-1 font-Jost flex items-center">
            <Mail className="h-4 w-4 mr-1" />
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={billingForm.email || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md font-Jost ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., john@example.com"
          />
          {formErrors.email && (
            <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-Accent mb-1 font-Jost flex items-center">
            <Phone className="h-4 w-4 mr-1" />
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone_number"
            value={billingForm.phone_number || ''}
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
      </div>
      
      <div>
        <label className="block text-sm font-medium text-Accent mb-1 font-Jost flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          Address Line 1 *
        </label>
        <input
          type="text"
          name="address_line_1"
          value={billingForm.address_line_1 || ''}
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
          value={billingForm.address_line_2 || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Apartment, suite, unit, building, floor, etc."
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
            value={billingForm.city || ''}
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
            value={billingForm.state || ''}
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
            value={billingForm.zip_code || ''}
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
          value={billingForm.country || 'Nigeria'}
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

export default BillingAddressForm;