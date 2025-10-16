import React from 'react';

const DebugBundleData = ({ bundleItems }) => {
  if (!bundleItems || bundleItems.length === 0) {
    return <div>No bundle items</div>;
  }

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'white', padding: '10px', border: '1px solid #ccc', zIndex: 1000, maxHeight: '400px', overflow: 'auto' }}>
      <h3>Bundle Data Debug</h3>
      {bundleItems.map((bundle, bundleIndex) => (
        <div key={bundleIndex} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #eee' }}>
          <h4>Bundle {bundleIndex + 1}: {bundle.bundle_name}</h4>
          <p>Bundle ID: {bundle.bundle_id}</p>
          <p>Order Item ID: {bundle.id}</p>
          <p>Quantity: {bundle.quantity}</p>
          
          {bundle.bundle_items && (
            <div>
              <h5>Bundle Items (Raw):</h5>
              <pre style={{ fontSize: '10px', background: '#f5f5f5', padding: '5px' }}>
                {JSON.stringify(bundle.bundle_items, null, 2)}
              </pre>
              
              <h5>Grouped Items:</h5>
              {(() => {
                const groupedItems = bundle.bundle_items.reduce((acc, item) => {
                  const key = `${item.product_id}-${item.color_name || 'no-color'}-${item.size_name || 'no-size'}`;
                  if (!acc[key]) {
                    acc[key] = {
                      ...item,
                      quantity: parseInt(item.quantity) || 1,
                      count: 1
                    };
                  } else {
                    acc[key].quantity += parseInt(item.quantity) || 1;
                    acc[key].count += 1;
                  }
                  return acc;
                }, {});
                
                return (
                  <pre style={{ fontSize: '10px', background: '#e8f5e8', padding: '5px' }}>
                    {JSON.stringify(Object.values(groupedItems), null, 2)}
                  </pre>
                );
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DebugBundleData;