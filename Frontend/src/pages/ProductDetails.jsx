import { useEffect, useState, useContext } from "react"
import { useParams, useSearchParams, useNavigate, useLocation, Link } from "react-router-dom"
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
  Ban,
} from "lucide-react"
import Footer from "../components/Footer"
import { useAuth } from "../context/AuthContext"
import { CurrencyContext } from "../pages/CurrencyContext"
import ReviewSection from "../components/ReviewSection"
import DescriptionSection from "../components/DescriptionSection"
import SmartProductSuggestions from "../components/SmartProductSuggestions"
import { toastSuccess, toastError } from "../utils/toastConfig"
import ProductSchema from "../components/ProductSchema"
import { getDetailImageUrl } from "../utils/imageUtils"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://tia-backend-r331.onrender.com"
const ProductDetails = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
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
  const [allBundleData, setAllBundleData] = useState({})
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
    Beige: "#E8DCC4",
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

    // Check if item is preorder
    const isPreorder = item.is_preorder !== undefined
      ? item.is_preorder
      : (item.item?.allow_preorder && (Number(item.item?.stock_quantity) || 0) <= 0);

    const cartItemData = {
      ...item,
      is_preorder: isPreorder,
    };

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      guestCart.items[existingItemIndex].quantity += item.quantity
    } else {
      // Add new item with unique ID
      guestCart.items.push({
        id: Date.now(), // Temporary ID
        ...cartItemData,
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
        // Determine item type from URL path
        const itemType = location.pathname.startsWith('/bundle/') ? 'bundle' : 'product'
        const res = await axios.get(`${API_BASE_URL}/api/products/${id}?type=${itemType}`)
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
          // Check for preloading URL parameters
          const preloadColor = searchParams.get("preloadColor")
          const preloadBundle = searchParams.get("preloadBundle")
          
          const defaultBundleType = res.data.data.bundle_type && ["3-in-1", "5-in-1"].includes(res.data.data.bundle_type)
            ? res.data.data.bundle_type
            : "3-in-1"
            
          const initialBundleType = preloadBundle && ["3-in-1", "5-in-1"].includes(preloadBundle) 
            ? preloadBundle 
            : defaultBundleType
            
          setBundleType(initialBundleType)
          
          // Cache current bundle data
          const bundleDataCache = {
            [res.data.data.bundle_type]: {
              id: res.data.data.id,
              price: res.data.data.price,
              images: Array.isArray(res.data.data.images) ? res.data.data.images : []
            }
          }
          
          // Pre-fetch sibling bundle (3-in-1 <-> 5-in-1) in background
          const siblingType = res.data.data.bundle_type === "3-in-1" ? "5-in-1" : "3-in-1"
          try {
            const siblingRes = await axios.get(`${API_BASE_URL}/api/products/${id}/sibling-bundle?targetType=${encodeURIComponent(siblingType)}`)
            if (siblingRes.data && siblingRes.data.id) {
              bundleDataCache[siblingType] = {
                id: siblingRes.data.id,
                price: siblingRes.data.price,
                images: Array.isArray(siblingRes.data.images) ? siblingRes.data.images : []
              }
            }
          } catch {
            // Sibling may not exist — that's OK
          }
          
          setAllBundleData(bundleDataCache)
          
          let preloadedVariants = {}
          
          if (preloadColor) {
            const allVariants = res.data.data.items?.[0]?.all_variants || []
            const variant = allVariants.find(v => v.color_name === preloadColor) || allVariants.find(v => v.color_name.toLowerCase() === preloadColor.toLowerCase())
            
            if (variant) {
              const numItems = initialBundleType === "5-in-1" ? 5 : 3
              for (let i = 0; i < numItems; i++) {
                preloadedVariants[i] = {
                  variantId: variant.variant_id,
                  colorName: variant.color_name,
                  sizeName: null,
                  sizeId: null
                }
              }
            }
          }
          
          setSelectedBundleVariants(preloadedVariants)
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
      const allVariants = productData.data.items?.[0]?.all_variants || []
      
      Object.entries(selectedBundleVariants).forEach(([key, selection]) => {
        // Find the variant for this selection to get the correct size_id
        const variant = allVariants.find(v => v.variant_id === selection.variantId)
        let newSizeId = selection.sizeId
        
        if (variant && variant.sizes) {
          const sizeMap = { XS: "XS", S: "S", M: "M", L: "L", XL: "XL" }
          const reverseSizeMap = Object.fromEntries(Object.entries(sizeMap).map(([k, v]) => [v, k]))
          
          const sizeObj =
            variant.sizes.find((s) => s.size_name === sizeName) ||
            variant.sizes.find((s) => s.size_name === sizeMap[sizeName]) ||
            variant.sizes.find((s) => s.size_name === reverseSizeMap[sizeName]) ||
            variant.sizes.find((s) => s.size_name?.toLowerCase() === sizeName?.toLowerCase())
            
          if (sizeObj) {
            newSizeId = sizeObj.size_id
          }
        }
        
        updatedVariants[key] = {
          ...selection,
          sizeName: sizeName,
          sizeId: newSizeId
        }
      })
      setSelectedBundleVariants(updatedVariants)
    }
  }
  const handleBundleTypeChange = async (newBundleType) => {
    // Always clear selections and reset image when switching bundle type
    setSelectedBundleVariants({})
    setSelectedSize(null)
    setSelectedImage(0)
    setBundleType(newBundleType)
    
    // If we don't have sibling data cached yet, fetch it now
    if (!allBundleData[newBundleType]) {
      try {
        const siblingRes = await axios.get(`${API_BASE_URL}/api/products/${id}/sibling-bundle?targetType=${encodeURIComponent(newBundleType)}`)
        if (siblingRes.data && siblingRes.data.id) {
          setAllBundleData(prev => ({
            ...prev,
            [newBundleType]: {
              id: siblingRes.data.id,
              price: siblingRes.data.price,
              images: Array.isArray(siblingRes.data.images) ? siblingRes.data.images : []
            }
          }))
        }
      } catch {
        // Sibling may not exist
      }
    }
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
            is_preorder: isPreorderActive, // Pass preorder flag
            price: isPreorderActive ? depositPrice : undefined // Pass deposit price if preorder
          })
          toastSuccess(isPreorderActive ? "Pre-order added to cart" : "Product added to cart")
          window.dispatchEvent(new Event("cartUpdated"))
          window.dispatchEvent(new Event("openCartModal"))
        } else {
          // Add to guest cart
          addToGuestCart({
            product_type: "single",
            variant_id: selectedVariant.variant_id,
            size_id: selectedSizeObj.size_id,
            quantity,
            price: isPreorderActive ? depositPrice : productPrice, // Use deposit price if preorder
            is_preorder: isPreorderActive, // Pass preorder flag
            item: {
              id: selectedVariant.variant_id,
              name: productName,
              image: productImage,
              color: selectedColor,
              size: selectedSize,
              price: isPreorderActive ? depositPrice : productPrice,
              original_price: productPrice, // Store original price
              stock_quantity: selectedSizeObj.stock_quantity,
              is_product: true,
              is_preorder: isPreorderActive,
              allow_preorder: isPreorderEnabled
            },
          })
          toastSuccess(isPreorderActive ? "Pre-order added to guest cart" : "Product added to guest cart")
          window.dispatchEvent(new Event("cartUpdated"))
          window.dispatchEvent(new Event("openCartModal"))
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
        // Use the correct bundle ID for the selected type (may be sibling bundle)
        const effectiveBundleId = allBundleData[bundleType]?.id || productData.data.id
        // Get bundle image
        const bundleImages = getBundleImages()
        const bundleImage = bundleImages[0] || productData?.data?.images?.[0] || "https://via.placeholder.com/500"
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
            effectiveBundleId,
            "bundle_type=",
            bundleType,
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
            bundle_id: effectiveBundleId,
            quantity,
            items: selectedItems.map((item) => ({
              variant_id: item.variantId,
              size_id: item.sizeId,
            })),
          })
          toastSuccess("Bundle added to cart")
          window.dispatchEvent(new Event("cartUpdated"))
          window.dispatchEvent(new Event("openCartModal"))
          // Reset bundle progress after adding to cart
          setSelectedBundleVariants({})
        } else {
          // Add to guest cart
          addToGuestCart({
            product_type: "bundle",
            bundle_id: effectiveBundleId,
            quantity,
            price: bundlePrice,
            is_preorder: isPreorderActive,
            items: selectedItems.map((item) => ({
              variant_id: item.variantId,
              size_id: item.sizeId,
            })),
            item: {
              id: effectiveBundleId,
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
          window.dispatchEvent(new Event("openCartModal"))
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
    // Use cached sibling bundle price if available
    if (allBundleData[bundleType]?.price) {
      return Number.parseFloat(allBundleData[bundleType].price) || 0
    }
    const basePrice = Number.parseFloat(productData.data.price) || 0
    const loadedType = productData.data.bundle_type || "3-in-1"
    // If the selected type matches the loaded bundle's type, return the actual price
    if (bundleType === loadedType) {
      return basePrice
    }
    // Fallback to standard bundle pricing
    if (bundleType === "5-in-1") return 98000
    if (bundleType === "3-in-1") return 59999
    return basePrice
  }
  if (loading || contextLoading || authLoading) {
    return (
      <div 
        className="min-h-screen bg-white"
        style={{
          '--color-Primarycolor': '#1E1E1E',
          '--color-Secondarycolor': '#ffffff',
          '--color-Accent': '#6E6E6E',
          '--font-Manrope': '"Manrope", "sans-serif"',
          '--font-Jost': '"Jost", "sans-serif"'
        }}
      >
        <Navbar2 />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-8 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Gallery Skeleton (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="w-full aspect-[3/4] bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-24 flex-shrink-0 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Product Details Skeleton (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="h-7 bg-gray-200 rounded-lg w-1/4 animate-pulse"></div>
              </div>

              <div className="border-t border-b border-gray-100 py-6 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-11 bg-gray-200 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <div className="h-14 bg-gray-300 rounded-xl w-full animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-full animate-pulse"></div>
              </div>

              <div className="space-y-3 pt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  if (error || !productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-Manrope">Oops! Product Not Found</h2>
          <p className="text-gray-600 font-Jost">{error || "Failed to load product"}</p>
        </div>
      </div>
    )
  }
  // Safely extract data with null checks
  const { type, data } = productData || {}
  const isProduct = type === "product"

  // For bundles: use cached images for the current bundleType, fallback to loaded bundle images
  const getBundleImages = () => {
    if (isProduct) return []
    // Use cached images for the current bundle type if available
    if (allBundleData[bundleType]?.images?.length > 0) {
      return allBundleData[bundleType].images
    }
    // Fallback to the loaded bundle's images
    return Array.isArray(data?.images) ? data.images : []
  }

  const images = isProduct
    ? Array.isArray(selectedVariant?.images)
      ? selectedVariant.images
      : []
    : getBundleImages()
  const name = data?.name || "Unnamed Product"
  const rawPrice = isProduct ? data?.price : getBundlePrice()
  const parsedPrice = Number.parseFloat(rawPrice) || 0

  // Preorder Logic
  const isPreorderEnabled = data?.allow_preorder || false;

  // Calculate if sold out
  const isProductSoldOut = isProduct && Array.isArray(selectedVariant?.sizes)
    ? selectedVariant.sizes.every(sz => (Number(sz.stock_quantity) || 0) <= 0)
    : false;

  // Helper to check bundle stock status
  const getBundleStockStatus = () => {
    if (isProduct) return { isSoldOut: false, isPreorder: false };

    // Iterate over selected items
    const selectedItems = Object.values(selectedBundleVariants);
    if (selectedItems.length === 0) return { isSoldOut: false, isPreorder: false };

    let hasOutOfStockItem = false;
    let canPreorderOutOfStockItems = true;

    const allVariants = data?.items?.[0]?.all_variants || [];

    for (const item of selectedItems) {
      if (!item.variantId || !item.sizeId) continue;

      const variant = allVariants.find(v => v.variant_id === item.variantId);
      if (!variant) continue;

      // Find size in variant sizes
      // Note: variant.sizes might handle size names or IDs depending on API
      // Here we try to match by size_id or size_name if id fails
      let sizeObj = variant.sizes?.find(s => s.size_id === item.sizeId);
      if (!sizeObj && item.sizeName) {
        sizeObj = variant.sizes?.find(s => s.size_name === item.sizeName);
      }

      if (!sizeObj) continue;

      if ((Number(sizeObj.stock_quantity) || 0) <= 0) {
        hasOutOfStockItem = true;
        // Check if this variant allows preorder
        // Use variant specific flag if available, otherwise fallback to global setting
        // Note: API needs to return allow_preorder for variants for granular control
        const variantAllowPreorder = variant.allow_preorder !== undefined ? variant.allow_preorder : isPreorderEnabled;

        if (!variantAllowPreorder) {
          canPreorderOutOfStockItems = false;
        }
      }
    }

    if (hasOutOfStockItem) {
      return { isSoldOut: !canPreorderOutOfStockItems, isPreorder: canPreorderOutOfStockItems };
    }

    return { isSoldOut: false, isPreorder: false };
  };

  const bundleStatus = !isProduct ? getBundleStockStatus() : { isSoldOut: false, isPreorder: false };

  const isAllSoldOut = isProduct ? isProductSoldOut : bundleStatus.isSoldOut;

  // Determine if the CURRENT selection is a preorder
  // Get current size object
  const currentSizes = isProduct ? (Array.isArray(selectedVariant?.sizes) ? selectedVariant.sizes : []) : [];
  const selectedSizeObj = currentSizes.find(s => s.size_name === selectedSize);
  const isSelectedSizeOutOfStock = selectedSizeObj ? (Number(selectedSizeObj.stock_quantity) || 0) <= 0 : false;

  // Preorder is active if:
  // 1. Preorder is globally enabled AND
  // 2. (The entire variant is sold out OR the specific selected size is sold out)
  // OR for bundles: calculated bundle preorder status
  const isPreorderActive = isProduct
    ? (isPreorderEnabled && (isAllSoldOut || isSelectedSizeOutOfStock))
    : bundleStatus.isPreorder;

  const depositPrice = isPreorderActive ? parsedPrice * 0.5 : parsedPrice;
  const isUSD = currency === "USD" || country !== "Nigeria";
  const displayPrice = isUSD ? (depositPrice / (exchangeRate || 1529.26)) : depositPrice;
  const displayCurrency = isUSD ? "USD" : "NGN";
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

  // Calculate if all sizes are sold out
  // const isAllSoldOut = sizeOptions.length > 0 && sizeOptions.every(s => s.stock_quantity <= 0); // Removed duplicate declaration


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
                5% OFF
              </div>
            </div>
            <div className="hidden sm:block text-white/40 mx-2">|</div>
            <div className="text-center sm:text-left">
              {/* Mobile version: shorter statement */}
              <div className="sm:hidden">
                <Link to="/login" className="text-sm text-white font-medium hover:text-yellow-300 transition-colors drop-shadow-sm">
                  Sign In to Save 5%!
                </Link>
              </div>
              {/* Desktop version: professional statement */}
              <div className="hidden sm:block">
                <Link to="/login" className="text-sm text-white font-medium hover:text-yellow-300 transition-colors drop-shadow-sm">
                  Sign In to Unlock 5% Off Your First Purchase
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
        <div className="bg-[#f3ede4] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative items-start">
            {/* Image Section */}
            <div className="p-4 sm:p-6 lg:p-0">
              <div className="flex flex-col gap-4 lg:gap-8">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-full bg-white flex justify-center items-center rounded-xl lg:rounded-none overflow-hidden group">
                    <img
                      src={getDetailImageUrl(img, 1000) || "https://via.placeholder.com/500"}
                      alt={`${name} view ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                      className="w-full max-w-lg h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Sold Out Overlay */}
                    {idx === 0 && isAllSoldOut && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                        <div className="bg-red-600/90 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl transform scale-110 border border-red-400/50">
                          <Ban className="w-6 h-6" />
                          <span className="text-lg font-bold tracking-wider font-Manrope uppercase">Sold Out</span>
                        </div>
                      </div>
                    )}
                    {/* Bundle Badge */}
                    {idx === 0 && !isProduct && !isAllSoldOut && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r font-Manrope from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                        <Package className="w-4 h-4" />
                        <span>Bundle</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Product Info Section */}
            <div className="p-3 sm:p-4 md:p-12 lg:sticky lg:top-24 self-start">
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-normal text-gray-900 leading-tight font-Manrope uppercase tracking-wide">
                        {name}
                      </h1>
                    </div>

                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-xl font-bold text-gray-900 font-Manrope">
                      {Number.parseFloat(displayPrice).toLocaleString(country === "Nigeria" ? "en-NG" : "en-US", {
                        style: "currency",
                        currency: displayCurrency,
                        minimumFractionDigits: country === "Nigeria" ? 0 : 2,
                      })}
                    </p>
                    <div className="flex items-center gap-2 flex-nowrap min-w-0">
                      <span className={`text-sm px-2 py-1 rounded-full font-Jost whitespace-nowrap ${isPreorderActive
                          ? "text-blue-600 bg-blue-50"
                          : isAllSoldOut
                            ? "text-red-600 bg-red-50"
                            : "text-green-600 bg-green-50"
                        }`}>
                        {isPreorderActive ? "Pre-order Available" : (isAllSoldOut ? "Sold Out" : "In Stock")}
                      </span>
                      {isPreorderActive && (
                        <span className="text-xs text-gray-500 font-Jost bg-gray-100 px-2 py-1 rounded-full">
                          Pay 50% Deposit
                        </span>
                      )}
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
                    <div className="flex items-center gap-4">
                      <h3 className="text-xs font-semibold text-gray-900 font-Manrope uppercase tracking-wider w-16">
                        COLOUR:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`relative flex items-center justify-center transition-all duration-200 ${color === selectedColor
                                ? "ring-1 ring-gray-900 ring-offset-2"
                                : "hover:ring-1 hover:ring-gray-300 hover:ring-offset-1"
                              }`}
                          >
                            <div
                              className={`w-4 h-4 shadow-sm ${color === "White" ? "border border-gray-300" : ""}`}
                              style={{ backgroundColor: colorMap[color] || "#cccccc" }}
                              title={color}
                            ></div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Size Selection */}
                    <div className="flex items-center gap-4">
                      <h3 className="text-xs font-semibold text-gray-900 font-Manrope uppercase tracking-wider w-16">
                        SIZE:
                      </h3>
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex flex-wrap gap-3">
                          {sizeOptions.map((s) => (
                            <button
                              key={s.size_name}
                              onClick={() => handleSizeChange(s.size_name)}
                              disabled={s.stock_quantity === 0 && !isPreorderEnabled}
                              title={s.stock_quantity === 0 ? (isPreorderEnabled ? "Pre-order" : "Sold Out") : "Select size"}
                              className={`relative text-xs font-Manrope transition-all duration-200 ${selectedSize === s.size_name
                                  ? "text-gray-900 font-bold"
                                  : (s.stock_quantity > 0 || isPreorderEnabled)
                                    ? "text-gray-500 hover:text-gray-900"
                                    : "text-gray-300 cursor-not-allowed line-through"
                                }`}
                            >
                              {s.size_name}
                              {s.stock_quantity === 0 && isPreorderEnabled && (
                                <span className="absolute -top-3 -right-3 text-[8px] text-blue-600">
                                  Pre
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        <button className="text-[10px] text-gray-500 hover:text-gray-900 underline uppercase tracking-wider whitespace-nowrap">
                          Size guide
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Bundle Options */}
                {!isProduct && (
                  <div className="space-y-6">
                    {/* Bundle Type Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">Bundle Type</h3>
                      <div className="flex space-x-4">
                        {bundleTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => handleBundleTypeChange(type)}
                            className={`px-6 py-3 border-2 rounded-xl text-sm font-medium font-Jost transition-all duration-200 ${bundleType === type
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">
                        Size: <span className="font-normal text-gray-600 font-Manrope">{selectedSize}</span>
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {sizeOptions.map((size) => (
                          <button
                            key={size.size_name}
                            onClick={() => handleSizeChange(size.size_name)}
                            disabled={size.stock_quantity === 0}
                            title={size.stock_quantity === 0 ? "Sold Out" : "Select size"}
                            className={`relative py-3 px-2 text-sm font-medium font-Jost border-2 rounded-xl transition-all duration-200 ${selectedSize === size.size_name
                                ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                : size.stock_quantity > 0
                                  ? "border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-md"
                                  : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                              }`}
                          >
                            {size.size_name}
                            {size.stock_quantity === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Ban className="w-4 h-4 text-red-500" aria-label="Sold Out" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Bundle Color Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">
                        Select Items
                        <span className="text-sm font-normal text-gray-600 ml-2 font-Jost">
                          ({Object.keys(selectedBundleVariants).length}/{bundleType === "3-in-1" ? "3" : "5"})
                        </span>
                      </h3>
                      <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                        {/* Available Colors */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3 font-Manrope">Available Colors</h4>
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
                                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${colorCount > 0
                                        ? "border-purple-500 bg-purple-100 shadow-lg"
                                        : canSelect
                                          ? "border-gray-200 bg-white hover:border-gray-300"
                                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                      }`}
                                  >
                                    <div
                                      className={`w-8 h-8 rounded-full shadow-sm mb-2 ${variant.color_name === "White" ? "border-2 border-gray-300" : ""
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
                            <h4 className="font-medium text-gray-900 mb-3 font-Manrope">Selected Items</h4>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(selectedBundleVariants).map(([index, selection]) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-5 h-5 rounded-full shadow-sm ${selection.colorName === "White" ? "border border-gray-300" : ""
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
                {/* Add to Bag */}
                <div className="space-y-4 pt-4">
                  <div className="flex w-full">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="w-full py-4 bg-gray-900 text-white font-medium flex items-center justify-center space-x-2 hover:bg-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                      <span className="font-Manrope">{isAddingToCart ? "ADDING..." : isPreorderActive ? "PRE-ORDER NOW" : "ADD TO BAG"}</span>
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
                {/* Accordions */}
                <div className="pt-4 flex flex-col">
                  <div className="border-t border-gray-200">
                    <button className="w-full py-3 flex justify-between items-center text-xs font-medium uppercase tracking-wider text-left text-gray-800 hover:text-black">
                      DETAILS
                    </button>
                  </div>
                  <div className="border-t border-gray-200">
                    <button className="w-full py-3 flex justify-between items-center text-xs font-medium uppercase tracking-wider text-left text-gray-800 hover:text-black">
                      SHIPPING AND RETURN
                    </button>
                  </div>
                  <div className="border-t border-b border-gray-200">
                    <button className="w-full py-3 flex justify-between items-center text-xs font-medium uppercase tracking-wider text-left text-gray-800 hover:text-black">
                      THE COMPOSITION AND CARE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DescriptionSection isProduct={isProduct} description={description} data={data} />
          
          {/* Frequently Bought Together Smart Suggestions */}
          <SmartProductSuggestions 
            type="frequently-bought-together" 
            currentProductId={id} 
            currentProductPrice={displayPrice} 
            currentProductName={name} 
          />

          <ReviewSection productId={isProduct ? id : null} bundleId={isProduct ? null : id} productName={name} />

          {/* You May Also Like Recommendation Grid */}
          <SmartProductSuggestions 
            type="you-may-also-like" 
            currentProductId={id} 
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}
export default ProductDetails
