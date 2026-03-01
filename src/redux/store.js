import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import productReducer from "./slices/productSlice";
import persistenceMiddleware from "./middleware/persistenceMiddleware";

import { getFromLocalStorage } from "../utils/localStorage";

// Enhanced state recovery with backup fallback
const recoverState = (key, defaultValue = null) => {
  try {
    // Try to get the current state
    const current = getFromLocalStorage(key, null);
    if (current !== null) return current;

    // Fallback to backup state if available
    const backup = getFromLocalStorage('__app_state_backup__', null);
    if (backup && backup.state && backup.state.auth) {
      console.warn(`⚠️ Using backup state for ${key}`);
      return backup.state.auth[key] || backup.state.cart[key] || backup.state.wishlist[key] || defaultValue;
    }

    return defaultValue;
  } catch (error) {
    console.error(`❌ Error recovering state for ${key}:`, error);
    return defaultValue;
  }
};

const preloadedState = {
  auth: {
    users: recoverState("users", []),
    user: recoverState("user", null),
    isAuthenticated: recoverState("isAuthenticated", false),
    userMode: recoverState("userMode", "buyer"),
  },
  cart: {
    items: recoverState("cartItems", []),
  },
  wishlist: {
    items: recoverState("wishlistItems", []),
  },
};

// Enhanced store configuration with persistence middleware
const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    products: productReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check for better performance
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(persistenceMiddleware),
});

// Log store initialization
console.log("✅ Redux store initialized with persistent storage");

export default store;
