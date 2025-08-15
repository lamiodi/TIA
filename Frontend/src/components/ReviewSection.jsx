// ReviewSection.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Star, ThumbsUp, ThumbsDown, MoreHorizontal, ChevronDown, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReviewSection = ({ productId, bundleId, productName }) => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    comment: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  
  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('ReviewSection: Error decoding token:', err);
      return null;
    }
  };
  
  // Helper function to get the JWT token
  const getToken = () => {
    // First try to get token from user object
    if (user && user.token) {
      return user.token;
    }
    
    // If not in user object, get from localStorage
    return localStorage.getItem('token');
  };
  
  // Helper function to get user ID
  const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    
    // Decode token to get ID
    const tokenData = decodeToken(token);
    return tokenData?.id;
  };
  
  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    const token = getToken();
    return !!token; // Just check if token exists
  };
  
  // Fetch reviews with pagination
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = bundleId
        ? `${API_BASE_URL}/api/reviews?bundle_id=${bundleId}&page=${page}&limit=10`
        : `${API_BASE_URL}/api/reviews?product_id=${productId}&page=${page}&limit=10`;
      const token = getToken();
      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const fetchedReviews = Array.isArray(response.data.reviews) ? response.data.reviews : [];
      setReviews(fetchedReviews);
      setTotalReviews(Number.isFinite(response.data.total) ? response.data.total : 0);
    } catch (err) {
      console.error('ReviewSection: Fetch reviews error:', err.response?.data || err.message);
      const errorMessage = err.response?.status === 401 ? 'Session expired. Please log in again.' :
                          'Failed to load reviews. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      setReviews([]);
      setTotalReviews(0);
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: bundleId ? `/bundle/${bundleId}` : `/product/${productId}` } });
      }
    } finally {
      setLoading(false);
    }
  }, [productId, bundleId, page, user, navigate]);
  
  useEffect(() => {
    if (!authLoading) {
      fetchReviews();
    }
  }, [fetchReviews, authLoading]);
  
  // Image upload handling with react-dropzone
  const onDrop = useCallback((acceptedFiles) => {
    const maxSize = 9 * 1024 * 1024; // 9MB
    const filetypes = /jpeg|jpg|png/;
    const validFiles = acceptedFiles.filter((file) => {
      const isValidType = filetypes.test(file.type);
      const isValidSize = file.size <= maxSize;
      if (!isValidType) {
        toast.error(`File ${file.name} is not a valid image (JPG/PNG only).`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`File ${file.name} exceeds 9MB limit.`);
        return false;
      }
      return true;
    });
    if ((imageFiles.length || 0) + validFiles.length > 3) {
      toast.error('You can upload a maximum of 3 images.');
      return;
    }
    setImageFiles((prev) => [
      ...prev,
      ...validFiles.map((file) => Object.assign(file, { preview: URL.createObjectURL(file) })),
    ]);
  }, [imageFiles]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
    maxFiles: 3,
  });
  
  const removeImage = (index) => {
    setImageFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return newFiles;
    });
  };
  
  // Submit review with images
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (authLoading) {
      console.error('ReviewSection: Waiting for auth to load');
      toast.error('Authentication still loading, please wait.');
      return;
    }
    if (!isAuthenticated()) {
      toast.error('Please log in to submit a review.');
      navigate(`/login`, { state: { from: bundleId ? `/bundle/${bundleId}` : `/product/${productId}` } });
      return;
    }
    if (newReview.rating < 1 || newReview.rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars.');
      return;
    }
    setUploading(true);
    const userId = getUserId();
    const token = getToken();
    const formData = new FormData();
    formData.append('user_id', userId);
    if (!bundleId && productId) {
      formData.append('product_id', productId);
    }
    if (bundleId) {
      formData.append('bundle_id', bundleId);
    }
    formData.append('rating', newReview.rating);
    formData.append('title', newReview.title);
    formData.append('comment', newReview.comment);
    imageFiles.forEach((file) => formData.append('images', file));
    try {
      const response = await axios.post(`${API_BASE_URL}/api/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('ReviewSection: Review submitted:', response.data);
      toast.success('Review submitted successfully');
      setNewReview({ rating: 0, title: '', comment: '' });
      setImageFiles((prev) => {
        prev.forEach((file) => URL.revokeObjectURL(file.preview));
        return [];
      });
      setShowWriteReview(false);
      setPage(1);
      fetchReviews();
    } catch (err) {
      console.error('ReviewSection: Error submitting review:', err.response?.data || err.message);
      const errorMessage = err.response?.status === 401 ? 'Session expired. Please log in again.' :
                          err.response?.data?.error || 'Failed to submit review. Please try again.';
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        navigate(`/login`, { state: { from: bundleId ? `/bundle/${bundleId}` : `/product/${productId}` } });
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Handle voting
  const handleVote = async (reviewId, voteType) => {
    if (authLoading) {
      console.error('ReviewSection: Waiting for auth to load');
      toast.error('Authentication still loading, please wait.');
      return;
    }
    if (!isAuthenticated()) {
      console.log('ReviewSection: No authenticated user, redirecting to /login');
      toast.error('Please log in to vote on reviews.');
      navigate(`/login`, { state: { from: bundleId ? `/bundle/${bundleId}` : `/product/${productId}` } });
      return;
    }
    if (userVotes[reviewId]) {
      toast.error('You have already voted on this review.');
      return;
    }
  
    try {
      const userId = getUserId();
      const token = getToken();
      console.log('ReviewSection: Sending vote request', { reviewId, voteType, user_id: userId });
      const response = await axios.post(
        `${API_BASE_URL}/api/reviews/${reviewId}/vote`,
        { vote_type: voteType, user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('ReviewSection: Vote response', response.data);
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId && voteType === 'helpful'
            ? { ...review, helpful: (review.helpful || 0) + 1 }
            : review
        )
      );
      setUserVotes({ ...userVotes, [reviewId]: voteType });
      toast.success(`${voteType === 'helpful' ? 'Helpful' : 'Not helpful'} vote recorded!`);
    } catch (err) {
      console.error('ReviewSection: Vote error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage = err.response?.status === 401 ? 'Session expired. Please log in again.' :
                          err.response?.data?.error || 'Failed to record vote. Please try again.';
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        navigate(`/login`, { state: { from: bundleId ? `/bundle/${bundleId}` : `/product/${productId}` } });
      }
    }
  };
  
  // Rest of the component remains unchanged
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: totalReviews > 0 ? (reviews.filter((r) => r.rating === rating).length / totalReviews) * 100 : 0,
  }));
  const filteredReviews = reviews
    .filter((review) => filterRating === 'all' || review.rating === parseInt(filterRating))
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date || 0) - new Date(a.date || 0);
        case 'oldest':
          return new Date(a.date || 0) - new Date(b.date || 0);
        case 'highest':
          return (b.rating || 0) - (a.rating || 0);
        case 'lowest':
          return (a.rating || 0) - (b.rating || 0);
        case 'helpful':
          return (b.helpful || 0) - (a.helpful || 0);
        default:
          return 0;
      }
    });
  const StarRating = ({ rating, size = 'w-4 h-4', interactive = false, onRate = null }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onRate && onRate(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          disabled={!interactive}
        >
          <Star
            className={`${size} ${star <= (rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
      <div className="p-6 sm:p-8 lg:p-12">
        <div className="flex flex-col items-start sm:items-center sm:flex-row sm:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-Manrope font-bold text-Primarycolor mb-2">Customer Reviews</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex items-center  space-x-2">
                <StarRating rating={Math.round(averageRating)} />
                <span className="text-xl sm:text-2xl font-bold text-gray-900 font-Manrope">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-600 font-Manrope">Based on {totalReviews} reviews</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated()) {
                toast.error('Please log in to write a review.');
                navigate(`/login`, { state: { from: bundleId ? `/bundle/${bundleId}` : `/product/${productId}` } });
                return;
              }
              setShowWriteReview(!showWriteReview);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-Primarycolor-900 text-white rounded-xl font-semibold hover:bg-Primarycolor-800 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Write a Review
          </button>
        </div>
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8 mb-8">
          <div className="lg:col-span-1 mb-6 lg:mb-0">
            <h3 className="font-semibold text-gray-900 mb-4 font-Manrope">Rating Breakdown</h3>
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <div className="relative mb-2 sm:mb-0">
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium hover:border-gray-300 focus:border-gray-900 focus:outline-none transition-colors w-full"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium hover:border-gray-300 focus:border-gray-900 focus:outline-none transition-colors w-full"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest ">Oldest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredReviews.length} of {totalReviews} reviews
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}
        {showWriteReview && isAuthenticated() && (
          <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 font-Manrope">Write Your Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-Manrope">Rating</label>
                <StarRating
                  rating={newReview.rating}
                  size="w-8 h-8"
                  interactive={true}
                  onRate={(rating) => setNewReview({ ...newReview, rating })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  placeholder="Summarize your experience"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder={`Tell others about your experience with this ${bundleId ? 'bundle' : 'product'}`}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none transition-colors resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images (Max 3)</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center ${
                    isDragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  } hover:border-gray-300 transition-colors`}
                >
                  <input {...getInputProps()} />
                  <p className="text-gray-600">
                    {isDragActive
                      ? 'Drop the images here...'
                      : 'Drag & drop images here, or click to select (max 3, JPG/PNG, 9MB each)'}
                  </p>
                </div>
                {imageFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={file.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-gray-900 text-white rounded-full p-1 hover:bg-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <button
                  type="submit"
                  disabled={uploading}
                  className={`w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWriteReview(false);
                    setImageFiles([]);
                    imageFiles.forEach((file) => URL.revokeObjectURL(file.preview));
                  }}
                  className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <p className="text-gray-600 text-center">No reviews yet for this {bundleId ? 'bundle' : 'product'}.</p>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="p-6 border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br font-Jost from-gray-200 to-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {review.user_name && typeof review.user_name === 'string'
                        ? review.user_name.split(' ').map((n) => n[0]).join('').toUpperCase()
                        : 'AN'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 font-Manrope">{review.user_name || 'Anonymous'}</h4>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-gray-500 font-Jost">
                          {review.date ? new Date(review.date).toLocaleDateString() : 'Unknown Date'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="mt-2 sm:mt-0 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-900 mb-2 font-Manrope">{review.title || 'No Title'}</h5>
                  <p className="text-gray-700 leading-relaxed font-Jost">{review.comment || 'No comment provided.'}</p>
                </div>
                {Array.isArray(review.images) && review.images.length > 0 && (
                  <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {review.images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Review image ${index + 1}`}
                        className="w-full aspect-auto rounded-lg"
                      />
                    ))}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                    <button
                      onClick={() => handleVote(review.id, 'helpful')}
                      className={`flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                        userVotes[review.id] === 'helpful' ? 'text-gray-900 font-semibold' : ''
                      }`}
                      disabled={userVotes[review.id]}
                    >
                      <ThumbsUp className="w-4 h-4 font-Jost" />
                      <span>Helpful ({review.helpful || 0})</span>
                    </button>
                    <button
                      onClick={() => handleVote(review.id, 'not_helpful')}
                      className={`flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                        userVotes[review.id] === 'not_helpful' ? 'text-gray-900 font-semibold' : ''
                      }`}
                      disabled={userVotes[review.id]}
                    >
                      <ThumbsDown className="w-4 h-4 font-Jost" />
                      <span>Not helpful</span>
                    </button>
                  </div>
                  <button className="text-sm font-Jost text-gray-600 hover:text-gray-900 transition-colors">
                    Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {filteredReviews.length > 0 && page * 10 < totalReviews && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPage(page + 1)}
              className="w-full sm:w-auto px-8 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:shadow-md transition-all duration-200 font-Manrope"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;