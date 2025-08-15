import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Search, Users, Mail, Phone, Eye, XCircle, Calendar, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Customers = () => {
  const { admin, adminLoading, adminLogout } = useAdminAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  
  // Create an axios instance with admin auth headers
  const getAuthAxios = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      throw new Error('Admin not authenticated');
    }
    
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
  };
  
  useEffect(() => {
    if (!adminLoading && (!admin || !admin.isAdmin)) {
      setError('Admin access only');
      setLoading(false);
      toast.error('Admin access only');
      return;
    }
    
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the authenticated axios instance
        const authAxios = getAuthAxios();
        const res = await authAxios.get('/api/admin/users');
        
        const data = res.data;
        const formatted = data.map((customer) => ({
          id: customer.user_id || customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone_number: customer.phone_number,
          created_at: customer.created_at,
          is_admin: customer.is_admin,
          total_spent: customer.total_spent || 0,
        }));
        setCustomers(formatted);
        toast.success('Customers loaded successfully');
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          toast.error('Session expired. Please log in again.');
          adminLogout();
          return;
        }
        
        setError(`Failed to load customers: ${error.response?.data?.error || error.message}`);
        toast.error(`Failed to load customers: ${error.response?.data?.error || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (!adminLoading) fetchCustomers();
  }, [admin, adminLoading, adminLogout]);
  
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!selectedCustomer) return;
      
      try {
        setDetailsLoading(true);
        
        // Use the authenticated axios instance
        const authAxios = getAuthAxios();
        const addressesRes = await authAxios.get(`/api/admin/addresses/user/${selectedCustomer.id}`);
        
        setCustomerAddresses(addressesRes.data);
        
      } catch (error) {
        console.error('Failed to fetch customer details:', error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          adminLogout();
          return;
        }
        
        toast.error('Failed to load customer details');
      } finally {
        setDetailsLoading(false);
      }
    };
    
    if (selectedCustomer) {
      fetchCustomerDetails();
    }
  }, [selectedCustomer, adminLogout]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  const filteredCustomers = customers.filter(
    (customer) =>
      `${customer.first_name} ${customer.last_name}`
        .toLowerCase()
        .includes(customerSearchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );
  
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const renderCustomerModal = () => {
    if (!selectedCustomer) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 font-Manrope">
                Customer Details - {selectedCustomer.first_name} {selectedCustomer.last_name}
              </h2>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerAddresses([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {detailsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 font-Manrope">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-Jost">Full Name</p>
                          <p className="font-medium font-Manrope">
                            {selectedCustomer.first_name} {selectedCustomer.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-Jost">Email</p>
                          <p className="font-medium font-Manrope">{selectedCustomer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-Jost">Phone</p>
                          <p className="font-medium font-Manrope">
                            {selectedCustomer.phone_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-Jost">Joined</p>
                          <p className="font-medium font-Manrope">
                            {formatDate(selectedCustomer.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-Jost">Account Type</p>
                          <p className="font-medium font-Manrope">
                            {selectedCustomer.is_admin ? 'Administrator' : 'Customer'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500 font-Jost">Total Spent</span>
                        <span className="text-lg font-semibold text-green-600 font-Manrope">
                          {formatCurrency(selectedCustomer.total_spent)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Shipping Addresses */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 font-Manrope">Shipping Addresses</h3>
                  {customerAddresses && customerAddresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customerAddresses.map((address) => (
                        <div
                          key={address.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900 font-Manrope">
                              {address.title || 'Default'}
                            </p>
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded-full font-Jost">
                              {address.country}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 font-Jost">
                            <div className="flex items-start">
                              <MapPin className="w-4 h-4 mr-1 mt-0.5 text-gray-500 flex-shrink-0" />
                              <div>
                                <div>{address.address_line_1}</div>
                                {address.landmark && (
                                  <div>Landmark: {address.landmark}</div>
                                )}
                                {address.address_line_2 && (
                                  <div>{address.address_line_2}</div>
                                )}
                                <div>
                                  {address.city}, {address.state} {address.zip_code}
                                </div>
                                <div>{address.country}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 font-Jost">No shipping addresses found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className="space-y-6"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-Jost">{error}</p>
            </div>
          </div>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-900 font-Manrope">
                Customers Management
              </h2>
              <div className="relative w-full md:w-96">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-Jost"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-Jost">No customers found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Phone</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Total Spent</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Joined</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900 text-sm">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-800 font-medium font-Manrope">
                                    {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 font-Manrope">
                                  {customer.first_name} {customer.last_name}
                                </div>
                                {customer.is_admin && (
                                  <div className="text-xs text-blue-600 font-Jost">Admin</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm font-Jost">{customer.email}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm font-Jost">
                            {customer.phone_number || 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-medium text-sm font-Manrope">
                            {formatCurrency(customer.total_spent)}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm font-Jost">
                            {formatDate(customer.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 font-Jost"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 font-Jost"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700 font-Jost">
                          Showing <span className="font-medium">{indexOfFirstCustomer + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(indexOfLastCustomer, filteredCustomers.length)}
                          </span>{' '}
                          of <span className="font-medium">{filteredCustomers.length}</span> customers
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 font-Jost"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => paginate(pageNumber)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium font-Jost ${
                                  currentPage === pageNumber
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 font-Jost"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {renderCustomerModal()}
        </>
      )}
    </div>
  );
};

export default Customers;