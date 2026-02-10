
import { jest } from '@jest/globals';

// Define mockSql before imports
const mockSql = jest.fn();

// Helper to handle template literals in sql mock
mockSql.begin = jest.fn((callback) => callback(mockSql));

// Mock the database module BEFORE importing controllers
jest.unstable_mockModule('../db/index.js', () => ({
  __esModule: true,
  default: mockSql,
}));

// Dynamic imports for controllers
let addToCart, createOrder, getOrderById;

describe('Preorder Flow', () => {
  let req, res;

  beforeAll(async () => {
    // Import controllers after mocking
    const cartModule = await import('../controllers/cartController.js');
    addToCart = cartModule.addToCart;
    
    const orderModule = await import('../controllers/orderController.js');
    createOrder = orderModule.createOrder;
    getOrderById = orderModule.getOrderById;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSql.mockReset();
    mockSql.begin.mockImplementation((callback) => callback(mockSql));
    
    req = {
      body: {},
      params: {},
      headers: {},
      user: { id: 1, isAdmin: true }, // Mock authenticated user
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  const normalize = (str) => str.replace(/\s+/g, ' ').trim();

  describe('1. Add to Cart (Preorder)', () => {
    it('should add an out-of-stock item as preorder if allow_preorder is true', async () => {
      req.body = {
        user_id: 1,
        product_type: 'single',
        variant_id: 101,
        size_id: 201,
        quantity: 1,
      };

      // Mock DB responses for addToCart
      mockSql.mockImplementation((strings, ...values) => {
        let query = '';
        if (Array.isArray(strings)) {
             query = strings.join('?');
        } else {
            query = String(strings);
        }
        
        const normQuery = normalize(query);

        // 1. Get/Create Cart
        if (normQuery.includes('SELECT id FROM cart')) return Promise.resolve([{ id: 500 }]);
        if (normQuery.includes('INSERT INTO cart')) return Promise.resolve([{ id: 500 }]);
        
        // 2. Validate Single Product (Variant info)
        if (normQuery.includes('SELECT pv.id, p.base_price, vs.stock_quantity, p.allow_preorder')) {
          return Promise.resolve([{
            id: 101,
            base_price: 10000,
            stock_quantity: 0, // Out of stock
            allow_preorder: true, // But allows preorder
          }]);
        }

        // 3. Get Color/Size names
        if (normQuery.includes('SELECT c.color_name AS color_name')) {
          return Promise.resolve([{ color_name: 'Black', size_name: 'M' }]);
        }

        // 4. Product Info (Brief check)
        if (normQuery.includes('SELECT p.name, p.category')) {
          return Promise.resolve([{ name: 'T-Shirt', category: 'Tops' }]);
        }

        // 5. Check existing items
        if (normQuery.includes('SELECT id, quantity FROM cart_items')) return Promise.resolve([]);

        // 6. Insert into cart_items
        if (normQuery.includes('INSERT INTO cart_items')) {
            return Promise.resolve([{ id: 1001 }]); // Return new item ID
        }

        // 7. Update total
        if (normQuery.includes('UPDATE cart SET total')) return Promise.resolve([]);
        if (normQuery.includes('SELECT COALESCE(SUM')) return Promise.resolve([{ subtotal: 5000 }]);

        // 8. Fetch updated cart (final response)
        if (normQuery.includes('SELECT ci.id') && normQuery.includes('UNION ALL')) return Promise.resolve([{
            id: 1001,
            quantity: 1,
            is_preorder: true,
            item: {
                name: 'T-Shirt',
                is_preorder: true,
                allow_preorder: true
            }
        }]);
        
        if (normQuery.includes('SELECT id, total FROM cart WHERE id')) return Promise.resolve([{ id: 500, total: 5000 }]);

        return Promise.resolve([]);
      });

      await addToCart(req, res);

      // Verify Insert called with is_preorder = true
      const insertCall = mockSql.mock.calls.find(call => {
        const q = call[0].join ? call[0].join('?') : String(call[0]);
        return q.includes('INSERT INTO cart_items');
      });
      
      expect(insertCall).toBeDefined();
      
      // Check values passed to query
      // Values order: cart_id, variant_id, size_id, quantity, is_bundle, price, color_name, size_name, is_preorder
      // We expect the last one (or near last) to be true
      const values = insertCall.slice(1);
      expect(values).toContain(true); // is_preorder should be true
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: expect.arrayContaining([
            expect.objectContaining({ is_preorder: true })
        ])
      }));
    });
  });

  describe('2. Create Order (Preorder)', () => {
    it('should create an order with is_preorder flag on items', async () => {
      req.body = {
        user_id: 1,
        address_id: 10,
        billing_address_id: 10,
        cart_id: 500,
        total: 6000,
        base_currency_total: 6000,
        converted_total: 6000,
        payment_method: 'card',
        currency: 'NGN',
        reference: 'REF123',
        delivery_option: 'standard',
        shipping_cost: 1000,
        shipping_method_id: 1,
        items: [
          {
            variant_id: 101,
            size_id: 201,
            quantity: 1,
            price: 5000, // 50% of 10000
            is_preorder: true,
            size_name: 'M'
          }
        ]
      };

      mockSql.mockImplementation((strings, ...values) => {
        let query = '';
        if (Array.isArray(strings)) {
             query = strings.join('?');
        } else {
            query = String(strings);
        }
        const normQuery = normalize(query);

        // Check reference existence
        if (normQuery.includes('SELECT id, payment_status, status FROM orders WHERE reference')) return Promise.resolve([]);
        if (normQuery.includes('SELECT id, payment_status, status, reference FROM orders')) return Promise.resolve([]); 

        // User check
        if (normQuery.includes('SELECT id, first_name')) return Promise.resolve([{ id: 1, first_name: 'Test', last_name: 'User', is_temporary: false, email: 'test@example.com' }]);

        // Address check
        if (normQuery.includes('SELECT id, country') && normQuery.includes('addresses')) return Promise.resolve([{ id: 10, country: 'Nigeria', address_line_1: 'Lagos', city: 'Lagos', state: 'Lagos', zip_code: '100001', address_line_2: '' }]);
        
        // Billing Address check
        if (normQuery.includes('SELECT id FROM billing_addresses')) return Promise.resolve([{ id: 10, address_line_1: 'Lagos', city: 'Lagos', state: 'Lagos', zip_code: '100001', address_line_2: '' }]);

        // Insert Billing Address (when billing_address_id === address_id)
        if (normQuery.includes('INSERT INTO billing_addresses')) return Promise.resolve([{ id: 11 }]);

        // User Info check for billing creation
        if (normQuery.includes('SELECT first_name, last_name, email FROM users')) return Promise.resolve([{ first_name: 'Test', last_name: 'User', email: 'test@example.com' }]);

        // Cart check
        if (normQuery.includes('SELECT id FROM cart')) return Promise.resolve([{ id: 500 }]);

        // Product Variant Check (Validation)
        if (normQuery.includes('SELECT pv.id, p.name')) {
            return Promise.resolve([{
                id: 101,
                name: 'T-Shirt',
                base_price: 10000,
                stock_quantity: 0,
                allow_preorder: true, 
                color_name: 'Black',
                size_name: 'M',
                image_url: 'http://example.com/img.jpg'
            }]);
        }

        // Stock check
        if (normQuery.includes('SELECT stock_quantity FROM variant_sizes')) {
            return Promise.resolve([{ stock_quantity: 0 }]); // Out of stock
        }

        // Insert Order
        if (normQuery.includes('INSERT INTO orders')) return Promise.resolve([{ id: 999 }]);

        // Insert Order Items
        if (normQuery.includes('INSERT INTO order_items')) return Promise.resolve([]);

        // Update Stock
        if (normQuery.includes('UPDATE variant_sizes')) return Promise.resolve([{ stock_quantity: -1 }]);
        
        // Update user first order
        if (normQuery.includes('UPDATE users')) return Promise.resolve([]);

        return Promise.resolve([]);
      });

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        order: expect.objectContaining({ id: 999 })
      }));

      // Verify Insert Order Items called with is_preorder = true
      const insertItemCall = mockSql.mock.calls.find(call => {
         const q = call[0].join ? call[0].join('?') : String(call[0]);
         return q.includes('INSERT INTO order_items');
      });
      expect(insertItemCall).toBeDefined();
      const values = insertItemCall.slice(1);
      expect(values).toContain(true); 
    });
  });

  describe('3. Admin View Order', () => {
    it('should return order details with is_preorder status', async () => {
      req.params = { id: 999 };

      mockSql.mockImplementation((strings, ...values) => {
        let query = '';
        if (Array.isArray(strings)) {
             query = strings.join('?');
        } else {
            query = String(strings);
        }
        const normQuery = normalize(query);

        // Check permission (mocked in controller)
        if (normQuery.includes('SELECT user_id FROM orders WHERE id')) return Promise.resolve([{ user_id: 1 }]);

        // Get Order
        if (normQuery.includes('FROM orders o') && normQuery.includes('JOIN users u')) {
            return Promise.resolve([{
                id: 999,
                user_id: 1,
                total: 5000,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                address_line_1: 'Lagos',
                city: 'Lagos',
                state: 'Lagos',
                zip_code: '100001',
                shipping_country: 'Nigeria',
                shipping_country_code: 'Nigeria',
                billing_full_name: 'Test User',
                billing_email: 'test@example.com'
            }]);
        }

        // Get Order Items
        if (normQuery.includes('FROM order_items oi')) {
            return Promise.resolve([{
                id: 1,
                variant_id: 101,
                is_preorder: true,
                product_name: 'T-Shirt',
                price: 5000,
                quantity: 1,
                size: 'M',
                color: 'Black',
                image: 'img.jpg'
            }]);
        }

        return Promise.resolve([]);
      });

      await getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: expect.arrayContaining([
            expect.objectContaining({ is_preorder: true })
        ])
      }));
    });
  });
});
