// src/App.js
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

const Login = lazy(() => import("./components/auth/Login"));
const Signup = lazy(() => import("./components/auth/Signup"));
const SellerGuard = lazy(() => import("./components/auth/SellerGuard"));
const SellerEntryGuard = lazy(() => import("./components/auth/SellerEntryGuard"));
const MainLayout = lazy(() => import("./components/layout/MainLayout"));
const LandingPage = lazy(() => import("./components/landing/LandingPage"));

const Home = lazy(() => import("./components/buyer/Home"));
const Cart = lazy(() => import("./components/buyer/Cart"));
const Wishlist = lazy(() => import("./components/buyer/Wishlist"));
const ProductDetails = lazy(() => import("./components/buyer/ProductDetails"));
const YouPage = lazy(() => import("./components/buyer/YouPage"));
const CouponsPage = lazy(() => import("./components/buyer/CouponsPage"));
const OrderHistory = lazy(() => import("./components/orders/OrderHistory"));

const SellerRegistration = lazy(() => import("./components/seller/SellerRegistration"));
const ProductListing = lazy(() => import("./components/seller/ProductListing"));
const SellerDashboard = lazy(() => import("./components/seller/SellerDashboard"));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage"));
const SettingsPage = lazy(() => import("./components/settings/SettingsPage"));

const defaultMeta = {
  title: "ThriftIt | Sustainable Thrift Marketplace",
  description:
    "Buy and sell quality pre-loved fashion on ThriftIt. Discover affordable, sustainable styles from trusted sellers.",
};

const routeMeta = {
  "/": {
    title: "ThriftIt | Sustainable Thrift Marketplace",
    description:
      "ThriftIt connects conscious buyers and sellers through a modern thrift marketplace for pre-loved fashion.",
  },
  "/home": {
    title: "Shop Thrift Fashion | ThriftIt",
    description:
      "Browse trending thrift pieces, discover unique fashion finds, and shop sustainably on ThriftIt.",
  },
  "/cart": {
    title: "Your Cart | ThriftIt",
    description: "Review and manage your selected thrift pieces before checkout.",
  },
  "/wishlist": {
    title: "Your Wishlist | ThriftIt",
    description: "Save favorite thrift finds and come back to shop them anytime.",
  },
  "/you": {
    title: "Your Account | ThriftIt",
    description: "Manage your profile, orders, and account preferences on ThriftIt.",
  },
  "/orders": {
    title: "Order History | ThriftIt",
    description: "Track and review your previous thrift purchases and delivery history.",
  },
  "/login": {
    title: "Login | ThriftIt",
    description: "Sign in to your ThriftIt account to buy, sell, and manage your orders.",
  },
  "/signup": {
    title: "Create Account | ThriftIt",
    description: "Join ThriftIt to start buying and selling pre-loved fashion sustainably.",
  },
  "/seller-registration": {
    title: "Become a Seller | ThriftIt",
    description: "Register as a seller on ThriftIt and start listing pre-loved fashion items.",
  },
  "/seller-dashboard": {
    title: "Seller Dashboard | ThriftIt",
    description: "Manage your listings, sales, and insights from your ThriftIt seller dashboard.",
  },
  "/seller-listing": {
    title: "List a Product | ThriftIt",
    description: "Create and publish a new thrift listing to reach buyers on ThriftIt.",
  },
};

const RouteMetadata = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const productPageMeta = pathname.startsWith("/product/")
      ? {
          title: "Product Details | ThriftIt",
          description:
            "View detailed product information, price, and sustainability impact before purchasing on ThriftIt.",
        }
      : null;
    const meta = productPageMeta || routeMeta[pathname] || defaultMeta;

    document.title = meta.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", meta.description);
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  return (
    <>
      <RouteMetadata />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Layout (Top header + Bottom nav) */}
          <Route element={<MainLayout />}>
            {/* Buyer routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/you" element={<YouPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Seller flow (separate from buyer browsing layout) */}
          <Route
            path="/seller-registration"
            element={
              <SellerEntryGuard>
                <SellerRegistration />
              </SellerEntryGuard>
            }
          />
          <Route
            path="/seller-dashboard"
            element={
              <SellerGuard>
                <SellerDashboard />
              </SellerGuard>
            }
          />
          <Route
            path="/seller-listing"
            element={
              <SellerGuard>
                <ProductListing />
              </SellerGuard>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
