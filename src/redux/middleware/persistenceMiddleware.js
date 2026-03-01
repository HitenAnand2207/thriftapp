// src/redux/middleware/persistenceMiddleware.js
import { saveToLocalStorage } from '../../utils/localStorage';

/**
 * Redux middleware for automatic localStorage persistence
 * Saves Redux state to localStorage on every action dispatch
 */
const persistenceMiddleware = (store) => (next) => (action) => {
  // Execute the action first
  const result = next(action);

  try {
    // Get the updated state after the action
    const state = store.getState();

    // Persist critical parts of the state
    const persistableState = {
      auth: {
        users: state.auth.users,
        user: state.auth.user,
        isAuthenticated: state.auth.isAuthenticated,
        userMode: state.auth.userMode,
      },
      cart: {
        items: state.cart.items,
      },
      wishlist: {
        items: state.wishlist.items,
      },
    };

    // Save each critical piece separately for better reliability
    saveToLocalStorage('users', persistableState.auth.users);
    saveToLocalStorage('user', persistableState.auth.user);
    saveToLocalStorage('isAuthenticated', persistableState.auth.isAuthenticated);
    saveToLocalStorage('userMode', persistableState.auth.userMode);
    saveToLocalStorage('cartItems', persistableState.cart.items);
    saveToLocalStorage('wishlistItems', persistableState.wishlist.items);

    // Also save a full state backup with timestamp for recovery
    const stateBackup = {
      timestamp: new Date().toISOString(),
      state: persistableState,
    };
    saveToLocalStorage('__app_state_backup__', stateBackup);

  } catch (error) {
    // Don't break the app if localStorage fails
    console.error('❌ Failed to persist state to localStorage:', error);
  }

  return result;
};

export default persistenceMiddleware;