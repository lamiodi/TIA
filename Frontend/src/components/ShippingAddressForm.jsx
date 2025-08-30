// src/components/ShippingAddressForm.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const ShippingAddressForm = ({ 
  address, 
  formErrors, 
  setFormErrors 
}) => {
  const { state: shippingForm, setState: setShippingForm } = address;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="space-y-4">
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
          value={shippingForm.country || 'Nigeria'}
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
    </div>
  );
};

export default ShippingAddressForm;