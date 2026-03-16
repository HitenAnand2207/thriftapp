// src/utils/razorpay.js

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const DEFAULT_RAZORPAY_KEY = "rzp_test_RmonAWA4BACRC9";
const RAZORPAY_PUBLIC_KEY =
  process.env.REACT_APP_RAZORPAY_KEY ||
  process.env.REACT_APP_RAZORPAY_KEY_ID ||
  DEFAULT_RAZORPAY_KEY;

/**
 * Dynamically load Razorpay script
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (document.querySelector("#razorpay-script")) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay Checkout
 * 
 * IMPORTANT FOR HACKATHON:
 * 1. Replace 'rzp_test_...' with your actual Razorpay Test Key
 * 2. Get it from: https://dashboard.razorpay.com/app/keys
 * 3. For production: Create order on backend first
 * 
 * @param {Object} params - Payment parameters
 * @param {number} params.amountInRupees - Total amount in rupees
 * @param {Object} params.user - User object with name, email, phone
 * @param {Function} params.onSuccess - Success callback
 * @param {Function} params.onFailure - Failure callback
 */
export const openRazorpayCheckout = async ({
  amountInRupees,
  user,
  onSuccess,
  onFailure,
}) => {
  // Load Razorpay script
  const loaded = await loadRazorpayScript();
  
  if (!loaded) {
    alert("⚠️ Failed to load Razorpay. Please check your internet connection.");
    onFailure && onFailure({ error: "Script loading failed" });
    return;
  }

  // Get Razorpay key from environment or use test key
  const razorpayKey = RAZORPAY_PUBLIC_KEY;
  
  // Warn if using placeholder key
  if (razorpayKey === DEFAULT_RAZORPAY_KEY) {
    console.warn("⚠️ Using placeholder Razorpay key. Please add your real key to .env file");
  }

  const options = {
    key: razorpayKey,
    amount: Math.round(amountInRupees * 100), // Convert to paise
    currency: "INR",
    name: "ThriftHub",
    description: "Thrift marketplace purchase - No returns/exchanges",
    image: "https://images.pexels.com/photos/6159954/pexels-photo-6159954.jpeg?auto=compress&cs=tinysrgb&w=200",
    
    // Payment success handler
    handler: function (response) {
      console.log("✅ Payment Success:", {
        payment_id: response.razorpay_payment_id,
        order_id: response.razorpay_order_id,
        signature: response.razorpay_signature,
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }
    },

    // Prefill user details
    prefill: {
      name: user?.name || user?.storeName || "",
      email: user?.email || "",
      contact: user?.phone || "",
    },

    // Notes (visible in dashboard)
    notes: {
      platform: "ThriftHub",
      platform_fee: "₹50 per item included",
      policy: "No returns or exchanges",
      user_id: user?.id || "",
    },

    // Theme customization
    theme: {
      color: "#7C3AED", // Purple-600
      backdrop_color: "rgba(0, 0, 0, 0.5)",
    },

    // Modal settings
    modal: {
      ondismiss: function () {
        console.log("❌ Payment cancelled by user");
        onFailure && onFailure({ error: "Payment cancelled" });
      },
      // Prevent accidental dismissal
      escape: true,
      backdropclose: false,
    },

    // Payment methods
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
    },

    // Retry settings
    retry: {
      enabled: true,
      max_count: 3,
    },

    // Timeout (10 minutes)
    timeout: 600,
  };

  try {
    const rzp = new window.Razorpay(options);

    // Handle payment failure
    rzp.on("payment.failed", function (response) {
      console.error("❌ Payment Failed:", {
        code: response.error.code,
        description: response.error.description,
        source: response.error.source,
        step: response.error.step,
        reason: response.error.reason,
      });

      // Call failure callback
      if (onFailure) {
        onFailure(response);
      }
    });

    // Open Razorpay modal
    rzp.open();
  } catch (error) {
    console.error("❌ Razorpay Error:", error);
    onFailure && onFailure({ error: error.message });
  }
};

/**
 * Format amount for display
 */
export const formatAmount = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Validate Razorpay payment signature (for backend)
 * This is just a helper - actual validation MUST happen on backend
 */
export const validatePaymentSignature = (orderId, paymentId, signature, secret) => {
  // This is a placeholder - implement on backend
  console.warn("⚠️ Payment signature validation should be done on backend");
  return true;
};
