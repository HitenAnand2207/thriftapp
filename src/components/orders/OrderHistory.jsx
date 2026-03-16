import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  Package,
  Calendar,
  IndianRupee,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  Download,
  MapPin,
  Leaf,
} from "lucide-react";
import SustainabilityDashboard from "../common/SustainabilityDashboard";

const OrderHistory = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'impact'

  const { products } = useSelector((state) => state.products);

  // Get sold items (simulating orders - in real app, you'd have an orders slice)
  const orders = useMemo(() => {
    return products
      .filter((p) => p.status === "sold")
      .map((p) => ({
        id: `ORDER${Date.now()}-${p.id}`,
        productId: p.id,
        productName: p.name,
        productImage: p.imageUrl,
        category: p.category,
        size: p.size,
        price: p.price,
        platformFee: 50,
        total: Number(p.price) + 50,
        orderDate: p.soldAt || p.listedAt,
        status: "Delivered",
        deliveryDate: p.soldAt || p.listedAt,
        sellerEmail: p.sellerEmail,
      }))
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  }, [products]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      Delivered: isDarkMode
        ? "bg-green-900/30 text-green-400 border-green-800"
        : "bg-green-50 text-green-700 border-green-200",
      Shipped: isDarkMode
        ? "bg-blue-900/30 text-blue-400 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200",
      Processing: isDarkMode
        ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
        : "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
    return colors[status] || colors.Processing;
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isDarkMode
              ? "bg-gray-800 border-2 border-gray-700"
              : "bg-purple-50 border-2 border-purple-100"
          }`}
        >
          <Package
            className={`w-12 h-12 ${
              isDarkMode ? "text-gray-600" : "text-purple-300"
            }`}
          />
        </div>
        <div>
          <h3
            className={`text-xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            No orders yet
          </h3>
          <p
            className={`text-sm max-w-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Start shopping to see your order history and environmental impact!
          </p>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Start Shopping
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div>
        <h2
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          My Orders & Impact
        </h2>
        <p
          className={`text-sm mt-1 ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {orders.length} {orders.length === 1 ? "order" : "orders"} • Track your sustainability journey
        </p>
      </div>

      {/* Tab Switcher */}
      <div
        className={`flex items-center gap-2 p-1 rounded-xl border ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-100 border-gray-200"
        }`}
      >
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
              : isDarkMode
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Package className="w-4 h-4" />
          Orders
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'impact'
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
              : isDarkMode
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Leaf className="w-4 h-4" />
          Impact
        </button>
      </div>

      {/* Content */}
      {activeTab === 'impact' ? (
        <SustainabilityDashboard />
      ) : (
        <>
          {/* Orders List */}
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                {/* Order Header */}
                <div
                  className={`px-6 py-4 border-b flex items-center justify-between ${
                    isDarkMode ? "border-gray-700" : "border-gray-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-mono ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Order #{order.id.slice(-8)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-2 mt-2 text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Ordered: {formatDate(order.orderDate)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <IndianRupee
                        className={`w-4 h-4 ${
                          isDarkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                      <span
                        className={`text-xl font-bold ${
                          isDarkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      >
                        {order.total.toFixed(0)}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      incl. delivery
                    </p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div
                      onClick={() => navigate(`/product/${order.productId}`)}
                      className="w-24 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer group"
                    >
                      <img
                        src={
                          order.productImage ||
                          "https://images.pexels.com/photos/6159954/pexels-photo-6159954.jpeg?auto=compress&cs=tinysrgb&w=800"
                        }
                        alt={order.productName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3
                          onClick={() => navigate(`/product/${order.productId}`)}
                          className={`font-semibold line-clamp-2 cursor-pointer hover:underline ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {order.productName}
                        </h3>
                        <div
                          className={`flex items-center gap-2 mt-1 text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <span>{order.category}</span>
                          {order.size && (
                            <>
                              <span>•</span>
                              <span>Size {order.size}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div
                        className={`space-y-1 text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span
                            className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                          >
                            Item price
                          </span>
                          <span>₹{order.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                          >
                            Platform fee
                          </span>
                          <span>₹{order.platformFee}</span>
                        </div>
                        <div
                          className={`flex justify-between font-semibold pt-1 border-t ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <span>Total paid</span>
                          <span>₹{order.total}</span>
                        </div>
                      </div>

                      {/* Seller Info */}
                      <div
                        className={`flex items-center gap-2 text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Sold by: {order.sellerEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => navigate(`/product/${order.productId}`)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      View Product
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => alert("Invoice download coming soon!")}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                        isDarkMode
                          ? "bg-purple-900/30 text-purple-400 hover:bg-purple-900/50"
                          : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      Download Invoice
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          <div
            className={`rounded-2xl p-6 border ${
              isDarkMode
                ? "bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-800/30"
                : "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
                }`}
              >
                <CheckCircle
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Total Orders: {orders.length}
                </h3>
                <p
                  className={`text-sm mt-0.5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Total spent: ₹
                  {orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderHistory;