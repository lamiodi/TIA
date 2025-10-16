import { useEffect, useState, useContext } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import Navbar2 from "../components/Navbar2"
import axios from "axios"
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Package,
  User,
} from "lucide-react"
import Footer from "../components/Footer"
import { useAuth } from "../context/AuthContext"
import { CurrencyContext } from "../pages/CurrencyContext"
import ReviewSection from "../components/ReviewSection"
import DescriptionSection from "../components/DescriptionSection"
import { toastSuccess, toastError } from "../utils/toastConfig"
import ProductSchema from "../components/ProductSchema"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://tia-backend-r331.onrender.com"
const ProductDetails = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const currencyContext = useContext(CurrencyContext)
  const { currency = "NGN", exchangeRate = 1, country = "Nigeria", contextLoading = false } = currencyContext || {}
  const variantParam = searchParams.get("variant")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [productData, setProductData] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [bundleType, setBundleType] = useState("3-in-1")

  const [selectedBundleVariants, setSelectedBundleVariants] = useState({})
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const colorMap = {
    Black: "#000000",
    White: "#FFFFFF",
    Gray: "#808080",
    Blue: "#0066CC",
    Brown: "#8B4513",
    Cream: "#F5F5DC",
    Pink: "#FFC0CB",
  }
  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
          })
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (err) {
      console.error("ProductDetails: Error decoding token:", err)
      return null
    }
  }
  // Helper function to get the JWT token
  const getToken = () => {
    // First try to get token from user object
    if (user && user.token) {
      return user.token
    }
    // If not in user object, get from localStorage
    return localStorage.getItem("token")
  }
  // Helper function to get user ID
  const getUserId = () => {
    const token = getToken()
    if (!token) return null
    // Decode token to get ID
    const tokenData = decodeToken(token)
    return tokenData?.id
  }
  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    const token = getToken()
    return !!token // Just check if token exists
  }
  // Load guest cart from localStorage
  const loadGuestCart = () => {
    try {
      const guestCart = localStorage.getItem("guestCart")
      if (guestCart) {
        return JSON.parse(guestCart)
      }
    } catch (err) {
      console.error("Error loading guest cart:", err)
    }
    return { items: [], subtotal: 0, tax: 0, total: 0 }
  }
  // Save guest cart to localStorage
  const saveGuestCart = (cart) => {
    try {
      localStorage.setItem("guestCart", JSON.stringify(cart))
    } catch (err) {
      console.error("Error saving guest cart:", err)
    }
  }
  // Helper function to check if an item is a brief product
  const isBriefItem = (item) => {
    if (!item || !item.item) return false;
    
    // For bundles, check bundle_types or name
    if (!item.item.is_product) {
      const name = (item.item.name || '').toLowerCase();
      return name.includes('brief') || 
             name.includes('boxer') || 
             name.includes('underwear') ||
             name.includes('trunk');
    }
    
    // For single products, check the name and category
    const name = (item.item.name || '').toLowerCase();
    const category = (item.item.category || '').toLowerCase();
    
    return name.includes('brief') || 
           name.includes('boxer') || 
           name.includes('underwear') ||
           name.includes('trunk') ||
           category.includes('brief');
  };

  // Helper function to validate brief minimum quantity for guest cart
  const validateGuestBriefQuantity = (cartItems) => {
    const briefItems = cartItems.filter(isBriefItem);
    const totalBriefQuantity = briefItems.reduce((sum, item) => sum + item.quantity, 0);
    const nonBriefItems = cartItems.filter(item => !isBriefItem(item));
    const isBriefOnlyCart = briefItems.length > 0 && nonBriefItems.length === 0;
    
    return {
      briefItems,
      totalBriefQuantity,
      isBriefOnlyCart,
      hasInsufficientBriefs: briefItems.length > 0 && totalBriefQuantity < 3
    };
  };

  // Add item to guest cart
  const addToGuestCart = (item) => {
    const guestCart = loadGuestCart()
    // Check if item already exists in cart
    const existingItemIndex = guestCart.items.findIndex((cartItem) => {
      if (item.product_type === "single") {
        return cartItem.variant_id === item.variant_id && cartItem.size_id === item.size_id
      } else {
        // For bundles, check if bundle_id AND items are identical
        if (cartItem.bundle_id !== item.bundle_id) return false
        
        // Check if items array is identical (same variant_id and size_id combinations)
        if (!cartItem.items || !item.items) return cartItem.bundle_id === item.bundle_id
        
        if (cartItem.items.length !== item.items.length) return false
        
        // Check each item in the bundle to see if they match
        return cartItem.items.every((cartItemDetail, index) => {
          const newItemDetail = item.items[index]
          return (
            cartItemDetail.variant_id === newItemDetail.variant_id &&
            cartItemDetail.size_id === newItemDetail.size_id
          )
        })
      }
    })
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      guestCart.items[existingItemIndex].quantity += item.quantity
    } else {
      // Add new item with unique ID
      guestCart.items.push({
        id: Date.now(), // Temporary ID
        ...item,
      })
    }
    // Recalculate totals
    guestCart.subtotal = guestCart.items.reduce((sum, cartItem) => sum + cartItem.quantity * cartItem.price, 0)
    guestCart.tax = country === "Nigeria" ? 0 : guestCart.subtotal * 0.05
    guestCart.total = guestCart.subtotal + guestCart.tax
    
    // Validate brief minimum quantity for guest cart
    const briefValidation = validateGuestBriefQuantity(guestCart.items);
    let warningMessage = null;
    
    if (briefValidation.hasInsufficientBriefs) {
      const remaining = 3 - briefValidation.totalBriefQuantity;
      warningMessage = `Minimum order quantity for briefs is 3 units. Please add ${remaining} more brief${remaining > 1 ? 's' : ''} to meet the requirement.`;
    }
    
    guestCart.warning = warningMessage;
    saveGuestCart(guestCart)
    window.dispatchEvent(new Event("cartUpdated"))
  }
  useEffect(() => {
    // Check if user is guest
    setIsGuest(!isAuthenticated())
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID is missing")
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await axios.get(`${API_BASE_URL}/api/products/${id}`)
        // Validate response data
        if (!res.data) {
          setError("Invalid product data received")
          return
        }
        setProductData(res.data)
        if (res.data.type === "product") {
          const variants = Array.isArray(res.data.data.variants) ? res.data.data.variants : []
          const variantIndex = variants.findIndex((v) => v.variant_id?.toString() === variantParam)
          const variant = variantIndex !== -1 ? variants[variantIndex] : variants[0]
          if (variant) {
            setSelectedVariant(variant)
            setSelectedColor(variant?.color_name || null)
            setSelectedSize(variant?.sizes?.[0]?.size_name || null)
          }
        } else {
          setBundleType(
            res.data.data.bundle_type && ["3-in-1", "5-in-1"].includes(res.data.data.bundle_type)
              ? res.data.data.bundle_type
              : "3-in-1",
          )
          setSelectedBundleVariants({})
          const sizes = res.data.data.items?.[0]?.all_variants?.[0]?.sizes || []
          setSelectedSize(sizes[0]?.size_name || null)
        }
      } catch (err) {
        console.error("Product fetch error:", err)
        setError(err.response?.data?.error || err.message || "Failed to fetch product")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, variantParam])
  const handleColorChange = (colorName) => {
    if (!productData || productData.type !== "product") return
    const variants = Array.isArray(productData.data.variants) ? productData.data.variants : []
    const variant = variants.find((v) => v.color_name === colorName)
    if (variant) {
      setSelectedVariant(variant)
      setSelectedColor(variant.color_name)
      setSelectedSize(variant.sizes?.[0]?.size_name || null)
      setSelectedImage(0)
    }
  }
  const handleSizeChange = (sizeName) => {
    setSelectedSize(sizeName)
    if (productData && productData.type === "bundle") {
      const updatedVariants = {}
      Object.entries(selectedBundleVariants).forEach(([key, selection]) => {
        updatedVariants[key] = {
          ...selection,
          sizeName: sizeName,
        }
      })
      setSelectedBundleVariants(updatedVariants)
    }
  }
  const handleBundleTypeChange = (newBundleType) => {
    const currentSelections = Object.keys(selectedBundleVariants).length
    const newMax = newBundleType === "3-in-1" ? 3 : 5
    if (currentSelections > newMax) {
      setSelectedBundleVariants({})
      setSelectedSize(null)
    }
    setBundleType(newBundleType)
  }
  const handleBundleColorSelection = (variant) => {
    const maxSelections = bundleType === "3-in-1" ? 3 : 5
    const totalSelected = Object.keys(selectedBundleVariants).length
    if (totalSelected >= maxSelections) return
    if (!selectedSize) {
      toastError("Please select a size first.")
      return
    }
    const sizeMap = {
      XS: "XS",
      S: "S",
      M: "M",
      L: "L",
      XL: "XL",
    }
    const reverseSizeMap = Object.fromEntries(Object.entries(sizeMap).map(([k, v]) => [v, k]))
    const sizes = Array.isArray(variant.sizes) ? variant.sizes : []
    const sizeObj =
      sizes.find((s) => s.size_name === selectedSize) ||
      sizes.find((s) => s.size_name === sizeMap[selectedSize]) ||
      sizes.find((s) => s.size_name === reverseSizeMap[selectedSize]) ||
      sizes.find((s) => s.size_name?.toLowerCase() === selectedSize?.toLowerCase())
    if (!sizeObj || !sizeObj.size_id) {
      toastError(`No valid size_id found for ${variant.color_name} (${selectedSize})`)
      return
    }
    const nextIndex = Object.keys(selectedBundleVariants).length
    setSelectedBundleVariants((prev) => ({
      ...prev,
      [nextIndex]: {
        variantId: variant.variant_id,
        colorName: variant.color_name,
        sizeName: sizeObj.size_name,
        sizeId: sizeObj.size_id,
      },
    }))
  }
  const removeBundleColor = (indexToRemove) => {
    const newSelections = {}
    let newIndex = 0
    Object.entries(selectedBundleVariants).forEach(([key, selection]) => {
      if (Number.parseInt(key) !== indexToRemove) {
        newSelections[newIndex] = selection
        newIndex++
      }
    })
    setSelectedBundleVariants(newSelections)
  }
  const handleAddToCart = async () => {
    if (isAddingToCart) return // Prevent multiple calls
    setIsAddingToCart(true)
    try {
      // Single product
      if (productData.type === "product") {
        if (!selectedVariant || !selectedSize) {
          toastError("Please select color and size")
          return
        }
        const sizes = Array.isArray(selectedVariant.sizes) ? selectedVariant.sizes : []
        const selectedSizeObj = sizes.find((s) => s.size_name === selectedSize)
        if (!selectedSizeObj) {
          toastError("Invalid size selected")
          return
        }
        // Get product image
        const productImage = selectedVariant.images?.[0] || "https://via.placeholder.com/500"
        // Get product name
        const productName = productData?.data?.name || "Unnamed Product"
        // Get product price
        const productPrice = Number.parseFloat(productData?.data?.price) || 0
        // Check if user is authenticated
        if (isAuthenticated()) {
          const userId = getUserId()
          if (!userId) {
            throw new Error("Could not determine user ID from authentication data")
          }
          const token = getToken()
          console.log(
            "Adding to cart: user_id=",
            userId,
            "variant_id=",
            selectedVariant.variant_id,
            "size_id=",
            selectedSizeObj.size_id,
          )
          const authAxios = axios.create({
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          await authAxios.post(`${API_BASE_URL}/api/cart`, {
            user_id: userId,
            product_type: "single",
            variant_id: selectedVariant.variant_id,
            size_id: selectedSizeObj.size_id,
            quantity,
          })
          toastSuccess("Product added to cart")
          window.dispatchEvent(new Event("cartUpdated"))
        } else {
          // Add to guest cart
          addToGuestCart({
            product_type: "single",
            variant_id: selectedVariant.variant_id,
            size_id: selectedSizeObj.size_id,
            quantity,
            price: productPrice,
            item: {
              id: selectedVariant.variant_id,
              name: productName,
              image: productImage,
              color: selectedColor,
              size: selectedSize,
              price: productPrice,
              stock_quantity: selectedSizeObj.stock_quantity,
              is_product: true,
            },
          })
          toastSuccess("Product added to guest cart")
          window.dispatchEvent(new Event("cartUpdated"))
        }
      }
      // Bundle product
      else if (productData.type === "bundle") {
        const totalRequired = bundleType === "3-in-1" ? 3 : 5
        const selectedItems = Object.values(selectedBundleVariants)
        if (selectedItems.length !== totalRequired) {
          toastError(`Please select ${totalRequired} items for the ${bundleType} bundle`)
          return
        }
        const allComplete = selectedItems.every((item) => item.variantId && item.sizeId)
        if (!allComplete) {
          toastError("Each bundle item must have both color and size selected")
          return
        }
        // Get bundle image
        const bundleImage = productData?.data?.images?.[0] || "https://via.placeholder.com/500"
        // Get bundle name
        const bundleName = productData?.data?.name || "Unnamed Bundle"
        // Get bundle price
        const bundlePrice = getBundlePrice()
        // Check if user is authenticated
        if (isAuthenticated()) {
          const userId = getUserId()
          if (!userId) {
            throw new Error("Could not determine user ID from authentication data")
          }
          const token = getToken()
          console.log(
            "Adding bundle to cart: user_id=",
            userId,
            "bundle_id=",
            productData.data.id,
            "items=",
            selectedItems,
          )
          const authAxios = axios.create({
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          await authAxios.post(`${API_BASE_URL}/api/cart`, {
            user_id: userId,
            product_type: "bundle",
            bundle_id: productData.data.id,
            quantity,
            items: selectedItems.map((item) => ({
              variant_id: item.variantId,
              size_id: item.sizeId,
            })),
          })
          toastSuccess("Bundle added to cart")
          window.dispatchEvent(new Event("cartUpdated"))
          // Reset bundle progress after adding to cart
          setSelectedBundleVariants({})
        } else {
          // Add to guest cart
          addToGuestCart({
            product_type: "bundle",
            bundle_id: productData.data.id,
            quantity,
            price: bundlePrice,
            items: selectedItems.map((item) => ({
              variant_id: item.variantId,
              size_id: item.sizeId,
            })),
            item: {
              id: productData.data.id,
              name: bundleName,
              image: bundleImage,
              price: bundlePrice,
              is_product: false,
              items: selectedItems.map((item) => ({
                variant_id: item.variantId,
                size_id: item.sizeId,
                color_name: item.colorName,
                size_name: item.sizeName,
                product_name: bundleName,
              })),
            },
          })
          toastSuccess("Bundle added to guest cart")
          window.dispatchEvent(new Event("cartUpdated"))
          // Reset bundle progress after adding to cart
          setSelectedBundleVariants({})
        }
      }
    } catch (err) {
      console.error("❌ Add to cart error:", err.response?.data || err.message)
      if (err.response?.status === 401) {
        toastError("Your session has expired. Please log in again.")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/login", {
          state: {
            from: `/product/${id}${variantParam ? `?variant=${variantParam}` : ""}`,
          },
        })
      } else {
        toastError(err.response?.data?.error || "Failed to add to cart. Please try again.")
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const getBundlePrice = () => {
    if (!productData || productData.type !== "bundle") return 0
    const basePrice = Number.parseFloat(productData.data.price) || 0
    return bundleType === "5-in-1" ? basePrice * 1.5 : basePrice
  }
  if (loading || contextLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-Primarycolor"></div>
          <p className="mt-2 text-sm font-Jost">Loading...</p>
        </div>
      </div>
    )
  }
  if (error || !productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-Inter">Oops! Product Not Found</h2>
          <p className="text-gray-600 font-Jost">{error || "Failed to load product"}</p>
        </div>
      </div>
    )
  }
  // Safely extract data with null checks
  const { type, data } = productData || {}
  const isProduct = type === "product"
  const images = isProduct
    ? Array.isArray(selectedVariant?.images)
      ? selectedVariant.images
      : []
    : Array.isArray(data?.images)
      ? data.images
      : []
  const name = data?.name || "Unnamed Product"
  const rawPrice = isProduct ? data?.price : getBundlePrice()
  const parsedPrice = Number.parseFloat(rawPrice) || 0
  const displayPrice = country === "Nigeria" ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2)
  const displayCurrency = country === "Nigeria" ? "NGN" : "USD"
  const description = data?.description || "No description available"
  const colorOptions = isProduct
    ? Array.isArray(data?.variants)
      ? data.variants.map((v) => v.color_name).filter(Boolean)
      : []
    : []
  const sortSizes = (sizes) => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL']
    return sizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a.size_name)
      const bIndex = sizeOrder.indexOf(b.size_name)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }
  
  const sizeOptions = isProduct
    ? sortSizes(Array.isArray(selectedVariant?.sizes) ? selectedVariant.sizes : [])
    : sortSizes(Array.isArray(data?.items?.[0]?.all_variants?.[0]?.sizes) ? data.items[0].all_variants[0].sizes : [])
  const bundleTypes = ["3-in-1", "5-in-1"]
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Product Schema for SEO */}
      <ProductSchema 
        productData={productData}
        selectedVariant={selectedVariant}
        selectedSize={selectedSize}
        isProduct={isProduct}
        currentUrl={window.location.href}
      />
      <Navbar2 />
      <div className="w-full border-b border-gray-800 relative mt-16" style={{
  background: 'linear-gradient(90deg, #1E1E1E 0%, #2A2A2A 40%, #6E6E6E 80%, #F5F5DC 100%)'
}}>
  {/* Dark overlay for text readability */}
  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>
  
  <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 relative z-10">
    <div className="flex items-center justify-center gap-4 sm:gap-6">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="bg-yellow-400/20 text-yellow-300 text-xs px-3 py-0.5 rounded-full font-bold border border-yellow-400/30 backdrop-blur-sm shadow-sm">
          10% OFF
        </div>
      </div>
      <div className="hidden sm:block text-white/40 mx-2">|</div>
      <div className="text-center sm:text-left">
        {/* Mobile version: shorter statement */}
        <div className="sm:hidden">
          <Link to="/login" className="text-sm text-white font-medium hover:text-yellow-300 transition-colors drop-shadow-sm">
            Sign In to Save 10%!
          </Link>
        </div>
        {/* Desktop version: professional statement */}
        <div className="hidden sm:block">
          <Link to="/login" className="text-sm text-white font-medium hover:text-yellow-300 transition-colors drop-shadow-sm">
            Sign In to Unlock 10% Off Your First Purchase
          </Link>
          <span className="text-xs text-white/80 ml-3 drop-shadow-sm">Exclusive for new customers</span>
        </div>
      </div>
    </div>
  </div>
  
  {/* Bottom gradient border */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
</div>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-24 py-4">
        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm font-Jost">
          <a href="/home" className="text-gray-500 hover:text-Primarycolor">
            Home
          </a>
          <span className="mx-2 text-gray-400">/</span>
          <a href="/shop" className="text-gray-500 hover:text-gray-700">
            Products
          </a>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-Primarycolor font-medium font-Jost">{name}</span>
        </nav>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="space-y-6">
                {/* Main Image */}
                <div className="relative aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-lg group">
                  <img
                    src={images[selectedImage] || "https://via.placeholder.com/500"}
                    alt="Product"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Bundle Badge */}
                  {!isProduct && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r font-Inter from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>Bundle</span>
                    </div>
                  )}
                  {/* Navigation Buttons */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                        className="absolute top-1/2 left-4 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-Jost">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>
                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                          selectedImage === idx ? "ring-2 ring-gray-900 shadow-lg" : "hover:shadow-md hover:scale-105"
                        }`}
                        onClick={() => setSelectedImage(idx)}
                      >
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedImage === idx && <div className="absolute inset-0 bg-gray-900/20"></div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Product Info Section */}
            <div className="p-3 sm:p-4 md:p-12">
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight font-Inter">
                        {name}
                      </h1>
                    </div>

                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900 font-Inter">
                      {Number.parseFloat(displayPrice).toLocaleString(country === "Nigeria" ? "en-NG" : "en-US", {
                        style: "currency",
                        currency: displayCurrency,
                        minimumFractionDigits: country === "Nigeria" ? 0 : 2,
                      })}
                    </p>
                    <div className="flex items-center gap-2 flex-nowrap min-w-0">
                    <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full font-Jost whitespace-nowrap">
                        In Stock
                      </span>
                      {!isProduct && (
                        <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-Jost whitespace-nowrap">
                          {bundleType} Bundle
                        </span>
                      )}
                      {isGuest && (
                        <span className="text-sm hidden  text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-Jost lg:flex items-center whitespace-nowrap">
                          <User className="w-3 h-3 mr-1" />
                          Guest Shopping
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Product Options */}
                {isProduct && (
                  <div className="space-y-6">
                    {/* Color Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Inter">
                        Color: <span className="font-normal font-Inter text-gray-600">{selectedColor}</span>
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                              color === selectedColor
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full shadow-sm ${color === "White" ? "border border-gray-300" : ""}`}
                              style={{ backgroundColor: colorMap[color] || "#cccccc" }}
                            ></div>
                            <span className="text-sm font-medium text-center font-Jost">{color}</span>
                            {color === selectedColor && <Check className="w-4 h-4 text-gray-900" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Size Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-Primarycolor font-Inter mb-4">
                        Size: <span className="font-normal text-gray-600 font-Inter">{selectedSize}</span>
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {sizeOptions.map((s) => (
                          <button
                            key={s.size_name}
                            onClick={() => handleSizeChange(s.size_name)}
                            disabled={s.stock_quantity === 0}
                            className={`relative py-3 px-2 text-sm font-Inter font-medium border-2 rounded-xl transition-all duration-200 ${
                              selectedSize === s.size_name
                                ? "border-Primarycolor bg-gray-900 text-white shadow-lg"
                                : s.stock_quantity > 0
                                  ? "border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-md"
                                  : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                            }`}
                          >
                            {s.size_name}
                            {s.stock_quantity === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-gray-300 rotate-45"></div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Bundle Options */}
                {!isProduct && (
                  <div className="space-y-6">
                    {/* Bundle Type Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Inter">Bundle Type</h3>
                      <div className="flex space-x-4">
                        {bundleTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => handleBundleTypeChange(type)}
                            className={`px-6 py-3 border-2 rounded-xl text-sm font-medium font-Jost transition-all duration-200 ${
                              bundleType === type
                                ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Size Selection for Bundle */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Inter">
                        Size: <span className="font-normal text-gray-600 font-Inter">{selectedSize}</span>
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {sizeOptions.map((size) => (
                          <button
                            key={size.size_name}
                            onClick={() => handleSizeChange(size.size_name)}
                            disabled={size.stock_quantity === 0}
                            className={`relative py-3 px-2 text-sm font-medium font-Jost border-2 rounded-xl transition-all duration-200 ${
                              selectedSize === size.size_name
                                ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                : size.stock_quantity > 0
                                  ? "border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-md"
                                  : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                            }`}
                          >
                            {size.size_name}
                            {size.stock_quantity === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-gray-300 rotate-45"></div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Bundle Color Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Inter">
                        Select Items
                        <span className="text-sm font-normal text-gray-600 ml-2 font-Jost">
                          ({Object.keys(selectedBundleVariants).length}/{bundleType === "3-in-1" ? "3" : "5"})
                        </span>
                      </h3>
                      <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                        {/* Available Colors */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3 font-Inter">Available Colors</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {(Array.isArray(data?.items?.[0]?.all_variants) ? data.items[0].all_variants : []).map(
                              (variant) => {
                                const colorCount = Object.values(selectedBundleVariants).filter(
                                  (selection) => selection?.colorName === variant.color_name,
                                ).length
                                const maxSelections = bundleType === "3-in-1" ? 3 : 5
                                const totalSelected = Object.keys(selectedBundleVariants).length
                                const canSelect = totalSelected < maxSelections
                                return (
                                  <button
                                    key={`${variant.variant_id}-${Date.now()}`}
                                    onClick={() => handleBundleColorSelection(variant)}
                                    disabled={!canSelect}
                                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                                      colorCount > 0
                                        ? "border-purple-500 bg-purple-100 shadow-lg"
                                        : canSelect
                                          ? "border-gray-200 bg-white hover:border-gray-300"
                                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                    }`}
                                  >
                                    <div
                                      className={`w-8 h-8 rounded-full shadow-sm mb-2 ${
                                        variant.color_name === "White" ? "border-2 border-gray-300" : ""
                                      }`}
                                      style={{ backgroundColor: colorMap[variant.color_name] || "#cccccc" }}
                                    />
                                    <span className="text-sm font-medium text-center font-Jost">
                                      {variant.color_name}
                                    </span>
                                    {colorCount > 0 && (
                                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {colorCount}
                                      </div>
                                    )}
                                    {canSelect && (
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        +
                                      </div>
                                    )}
                                  </button>
                                )
                              },
                            )}
                          </div>
                        </div>
                        {/* Selected Items Display */}
                        {Object.keys(selectedBundleVariants).length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3 font-Inter">Selected Items</h4>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(selectedBundleVariants).map(([index, selection]) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-5 h-5 rounded-full shadow-sm ${
                                        selection.colorName === "White" ? "border border-gray-300" : ""
                                      }`}
                                      style={{ backgroundColor: colorMap[selection.colorName] || "#cccccc" }}
                                    />
                                    <span className="text-sm font-medium text-gray-900 font-Jost">
                                      {selection.colorName}
                                    </span>
                                    <span className="text-xs text-gray-500 font-Jost">
                                      #{Number.parseInt(index) + 1}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => removeBundleColor(Number.parseInt(index))}
                                    className="text-red-400 hover:text-red-600 transition-colors ml-2"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Progress Indicator */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-Jost">Bundle Progress</span>
                            <span className="font-medium text-purple-600 font-Jost">
                              {Object.keys(selectedBundleVariants).length}/{bundleType === "3-in-1" ? "3" : "5"} items
                              selected
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(Object.keys(selectedBundleVariants).length / (bundleType === "3-in-1" ? 3 : 5)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Quantity and Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium font-Inter text-gray-900">Quantity:</span>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-3 font-medium min-w-[60px] text-center font-Jost">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-3 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-5 w-5 " />
                      <span className="font-Inter">{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                  {/* Guest Notice */}
                  {isGuest && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <p className="text-xs text-blue-700 font-Jost">
                          You're shopping as a guest. Your cart will be saved until you complete your purchase.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Features */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                  <div className="text-center space-y-2">
                    <Truck className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs text-gray-600 font-Jost">Free Shipping</p>
                  </div>
                  <div className="text-center space-y-2">
                    <RotateCcw className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs text-gray-600 font-Jost">Easy Returns</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Shield className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs text-gray-600 font-Jost">2 Year Warranty</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DescriptionSection isProduct={isProduct} description={description} data={data} />
          <ReviewSection productId={isProduct ? id : null} bundleId={isProduct ? null : id} productName={name} />
        </div>
      </div>
      <Footer />
    </div>
  )
}
export default ProductDetails