import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  PlusCircle,
  Package,
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  Trash2,
  Eye,
  IndianRupee,
  Calendar,
  BarChart3,
  LogOut,
} from "lucide-react";
import { deleteProduct } from "../../redux/slices/productSlice";
import { clearSellerSession, getSellerSession } from "../../utils/sellerSession";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();

  const { products } = useSelector((state) => state.products);
  const sellerUser = getSellerSession();

  const [selectedTab, setSelectedTab] = useState("all"); // all, available, sold

  // Filter products by seller
  const sellerProducts = useMemo(() => {
    return products.filter((p) => (p.sellerEmail || p.selleremail) === sellerUser?.email);
  }, [products, sellerUser]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const available = sellerProducts.filter((p) => p.status === "available");
    const sold = sellerProducts.filter((p) => p.status === "sold");
    const totalRevenue = sold.reduce((sum, p) => sum + Number(p.price || 0), 0);
    const avgPrice =
      available.length > 0
        ? available.reduce((sum, p) => sum + Number(p.price || 0), 0) /
          available.length
        : 0;

    return {
      totalListed: sellerProducts.length,
      available: available.length,
      sold: sold.length,
      totalRevenue,
      avgPrice,
    };
  }, [sellerProducts]);

  // Filter products based on tab
  const filteredProducts = useMemo(() => {
    if (selectedTab === "available") {
      return sellerProducts.filter((p) => p.status === "available");
    } else if (selectedTab === "sold") {
      return sellerProducts.filter((p) => p.status === "sold");
    }
    return sellerProducts;
  }, [sellerProducts, selectedTab]);

  const handleDeleteProduct = (productId, productName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      dispatch(deleteProduct(productId));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Welcome back, {sellerUser?.storeName || sellerUser?.name || "Seller"}! 👋
          </h2>
          <p
            className={`text-sm mt-1 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Manage your thrift store & track your sales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/seller-listing")}
            className="inline-flex items-center gap-2 brand-gradient text-white px-5 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">List Product</span>
          </button>
          <button
            onClick={() => {
              clearSellerSession();
              navigate("/seller-registration");
            }}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition ${
              isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Listed */}
        <div
          className={`rounded-2xl p-5 border ${
            isDarkMode
              ? "app-panel"
              : "app-panel-strong"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`p-2 rounded-lg ${
                isDarkMode ? "bg-purple-900/30" : "bg-purple-100"
              }`}
            >
              <Package
                className={`w-5 h-5 ${
                  isDarkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              />
            </div>
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {analytics.totalListed}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Total Products
            </p>
          </div>
        </div>

        {/* Available */}
        <div
          className={`rounded-2xl p-5 border ${
            isDarkMode
              ? "app-panel"
              : "app-panel-strong"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`p-2 rounded-lg ${
                isDarkMode ? "bg-green-900/30" : "bg-green-100"
              }`}
            >
              <ShoppingBag
                className={`w-5 h-5 ${
                  isDarkMode ? "text-green-400" : "text-green-600"
                }`}
              />
            </div>
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {analytics.available}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Available
            </p>
          </div>
        </div>

        {/* Sold */}
        <div
          className={`rounded-2xl p-5 border ${
            isDarkMode
              ? "app-panel"
              : "app-panel-strong"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`p-2 rounded-lg ${
                isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
              }`}
            >
              <CheckCircle
                className={`w-5 h-5 ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
              />
            </div>
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {analytics.sold}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Items Sold
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div
          className={`rounded-2xl p-5 border ${
            isDarkMode
              ? "app-panel"
              : "app-panel-strong"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`p-2 rounded-lg ${
                isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"
              }`}
            >
              <TrendingUp
                className={`w-5 h-5 ${
                  isDarkMode ? "text-yellow-400" : "text-yellow-600"
                }`}
              />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <IndianRupee
                className={`w-4 h-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              />
              <p
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {analytics.totalRevenue.toFixed(0)}
              </p>
            </div>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Total Revenue
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Banner */}
      {analytics.available > 0 && (
        <div
          className={`rounded-2xl p-4 border flex items-center gap-4 ${
            isDarkMode
              ? "bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border-emerald-800/30"
              : "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100"
          }`}
        >
          <div
            className={`p-3 rounded-full ${
              isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100"
            }`}
          >
            <BarChart3
              className={`w-6 h-6 ${
                isDarkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            />
          </div>
          <div className="flex-1">
            <h3
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Average Price: ₹{analytics.avgPrice.toFixed(0)}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Keep your prices competitive to attract more buyers
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className={`flex items-center gap-2 p-1 rounded-xl border ${
          isDarkMode
            ? "bg-slate-900/70 border-slate-700"
            : "bg-white/85 border-slate-200"
        }`}
      >
        <button
          onClick={() => setSelectedTab("all")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            selectedTab === "all"
              ? "brand-gradient text-white shadow-md"
              : isDarkMode
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All ({sellerProducts.length})
        </button>
        <button
          onClick={() => setSelectedTab("available")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            selectedTab === "available"
              ? "brand-gradient text-white shadow-md"
              : isDarkMode
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Available ({analytics.available})
        </button>
        <button
          onClick={() => setSelectedTab("sold")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            selectedTab === "sold"
              ? "brand-gradient text-white shadow-md"
              : isDarkMode
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Sold ({analytics.sold})
        </button>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl border-2 border-dashed ${
            isDarkMode
              ? "bg-slate-900/40 border-slate-700"
              : "bg-white/70 border-slate-200"
          }`}
        >
          <Package
            className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? "text-gray-600" : "text-gray-400"
            }`}
          />
          <p
            className={`font-medium ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {selectedTab === "all"
              ? "You haven't listed any products yet"
              : selectedTab === "available"
              ? "No available products"
              : "No sold products yet"}
          </p>
          <p
            className={`text-sm mt-1 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Start listing your thrift items to earn money
          </p>
          <button
            onClick={() => navigate("/seller-listing")}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 brand-gradient text-white rounded-xl font-medium hover:shadow-lg transition"
          >
            <PlusCircle className="w-5 h-5" />
            List Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className={`flex gap-4 rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md ${
                isDarkMode
                  ? "app-panel"
                  : "app-panel-strong"
              }`}
            >
              {/* Product Image */}
              <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={
                    p.imageUrl ||
                    p.imageurl ||
                    "https://images.pexels.com/photos/6159954/pexels-photo-6159954.jpeg?auto=compress&cs=tinysrgb&w=800"
                  }
                  alt={p.name}
                  className={`w-full h-full object-cover ${
                    p.status === "sold" ? "opacity-60 grayscale" : ""
                  }`}
                />
                {p.status === "sold" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-white text-xs font-bold">SOLD</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-between gap-2">
                <div>
                  <h3
                    className={`font-semibold line-clamp-2 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {p.name}
                  </h3>
                  <div
                    className={`flex items-center gap-2 mt-1 text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <span>{p.category}</span>
                    {p.size && (
                      <>
                        <span>•</span>
                        <span>Size {p.size}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <IndianRupee
                    className={`w-4 h-4 ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    />
                    <span
                      className={`text-lg font-bold ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      {Number(p.price || 0).toFixed(0)}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === "sold"
                        ? isDarkMode
                          ? "bg-red-900/30 text-red-400"
                          : "bg-red-100 text-red-700"
                        : isDarkMode
                        ? "bg-green-900/30 text-green-400"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {p.status === "sold" ? "Sold" : "Available"}
                  </span>
                </div>

                {/* Listed Date */}
                <div
                  className={`flex items-center gap-1 text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Listed: {formatDate(p.listedAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/product/${p.id}`)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition ${
                      isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 inline mr-1" />
                    View
                  </button>

                  {p.status === "available" && (
                    <button
                      onClick={() =>
                        handleDeleteProduct(p.id, p.name)
                      }
                      className={`p-2 rounded-lg transition ${
                        isDarkMode
                          ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
