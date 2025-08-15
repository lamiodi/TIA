import React from 'react';

const DescriptionSection = ({ isProduct, description, data }) => {
  return (
    <div className="bg-white font-Manrope overflow-hidden p-3 lg:p-12">
      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          {isProduct ? 'Product Details' : 'Bundle Details'}
        </h3>
        <p className="text-gray-600 font-Jost  leading-relaxed">{description}</p>

        {!isProduct && (
          <div className="mt-4 p-4 font-Manrope bg-purple-50 rounded-xl">
            <h4 className="font-medium text-purple-900 mb-2">Bundle Includes:</h4>
            <ul className="text-sm text-purple-800 font-Jost space-y-1">
              {data.items?.map((item, index) => (
                <li key={index}>• {item.product_name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DescriptionSection;