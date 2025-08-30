// src/components/BillingAddressForm.jsx
import React from 'react';

const BillingAddressForm = ({ 
  address, 
  formErrors, 
  setFormErrors 
}) => {
  const { state: billingForm, setState: setBillingForm } = address;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
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
      
      <div className="sm:col-span-2">
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
    </div>
  );
};

export default BillingAddressForm;