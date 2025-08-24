import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

const ShippingAddressForm = ({
  address,
  onSubmit,
  onCancel,
  formErrors,
  setFormErrors,
  actionLoading,
  isGuest = false, // New prop to indicate guest mode
  user // Optional: Pass user data if needed
}) => {
  const { state: shippingForm, setState: setShippingForm } = address;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!shippingForm.title) errors.title = 'Title is required';
    if (!shippingForm.address_line_1) errors.address_line_1 = 'Address line 1 is required';
    if (!shippingForm.city) errors.city = 'City is required';
    if (!shippingForm.state) errors.state = 'State is required';
    if (!shippingForm.zip_code) errors.zip_code = 'Zip code is required';
    if (!shippingForm.country) errors.country = 'Country is required';
    if (!shippingForm.phone_number) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^\+?\d{10,15}$/.test(shippingForm.phone_number.replace(/\s/g, ''))) {
      errors.phone_number = 'Invalid phone number format';
    }
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

    setIsSubmitting(true);
    try {
      if (isGuest) {
        // For guest users, pass the form data to the parent component
        onSubmit(shippingForm);
        toast.success('Shipping address saved');
      } else {
        // For authenticated users, proceed with API call (handled by parent)
        if (!user?.token) {
          toast.error('Please log in to add a shipping address.');
          navigate('/login', { state: { from: window.location.pathname } });
          return;
        }
        onSubmit(shippingForm);
        toast.success('Shipping address saved successfully');
      }
    } catch (err) {
      console.error('ShippingAddressForm: Error:', err);
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to save shipping address';
      toast.error(`Failed to save shipping address: ${errorMessage}`);
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
        <label className="block text-sm font-medium text-gray-700 font-Jost">Title</label>
        <input
          type="text"
          name="title"
          value={shippingForm.title || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="e.g., Home, Office"
          required
        />
        {formErrors.title && <p className="text-sm text-red-600 font-Jost">{formErrors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">Address Line 1</label>
        <input
          type="text"
          name="address_line_1"
          value={shippingForm.address_line_1 || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Street address"
          required
        />
        {formErrors.address_line_1 && <p className="text-sm text-red-600 font-Jost">{formErrors.address_line_1}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">Address Line 2</label>
        <input
          type="text"
          name="address_line_2"
          value={shippingForm.address_line_2 || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">Landmark</label>
        <input
          type="text"
          name="landmark"
          value={shippingForm.landmark || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Nearby landmark (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">City</label>
        <input
          type="text"
          name="city"
          value={shippingForm.city || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="City"
          required
        />
        {formErrors.city && <p className="text-sm text-red-600 font-Jost">{formErrors.city}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">State</label>
        <input
          type="text"
          name="state"
          value={shippingForm.state || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="State/Province"
          required
        />
        {formErrors.state && <p className="text-sm text-red-600 font-Jost">{formErrors.state}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">Zip Code</label>
        <input
          type="text"
          name="zip_code"
          value={shippingForm.zip_code || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Postal/Zip code"
          required
        />
        {formErrors.zip_code && <p className="text-sm text-red-600 font-Jost">{formErrors.zip_code}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">Country</label>
        <input
          type="text"
          name="country"
          value={shippingForm.country || 'Nigeria'}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Country"
          required
        />
        {formErrors.country && <p className="text-sm text-red-600 font-Jost">{formErrors.country}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-Jost">Phone Number</label>
        <input
          type="text"
          name="phone_number"
          value={shippingForm.phone_number || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
          placeholder="Phone number"
          required
        />
        {formErrors.phone_number && <p className="text-sm text-red-600 font-Jost">{formErrors.phone_number}</p>}
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center font-Jost"
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
          className="bg-gray-200 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-300 font-Jost"
          disabled={isSubmitting || actionLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ShippingAddressForm;