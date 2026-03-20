import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";
import { Sparkles, Shirt, TrendingUp, Filter } from "lucide-react";
import ProductCard from "./ProductCard";
import { fetchProducts } from "../../redux/slices/productSlice";

const brandReels = [
  { brand: "Nike", src: "/media/concept_nike_promo_remix.mp4" },
  { brand: "Adidas", src: "/media/5266698-hd_1920_1080_30fps.mp4" },
  { brand: "Puma", src: "/media/4126116-uhd_4096_2160_25fps.mp4" },
  { brand: "Levi's", src: "/media/12327025_2160_3840_60fps.mp4" },
  { brand: "Zara", src: "/media/7563865-hd_1080_1920_30fps.mp4" },
  { brand: "H&M", src: "/media/7563840-hd_1080_1920_30fps.mp4" },
  { brand: "Uniqlo", src: "/media/7563920-hd_1920_1080_30fps.mp4" },
  { brand: "Vintage Label", src: "/media/5925311-uhd_2160_3840_30fps.mp4" },
];

const reducedReels = brandReels.slice(0, 4);
const repeatedBrandReels = [...reducedReels, ...reducedReels];

const Home = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();

  const showStats = true;

  const {
    products,
    filteredProducts,
    selectedCategory,
    searchQuery,
    loading,
    error,
  } = useSelector(
    (state) => state.products
  );

  const hasActiveFilters =
    selectedCategory !== "All Categories" || Boolean(searchQuery?.trim());
  const list = hasActiveFilters ? filteredProducts : products;
  const availableProducts = list.filter((p) => p.status === "available");

  // Calculate stats
  const totalProducts = products.filter((p) => p.status === "available").length;
  const soldItems = products.filter((p) => p.status === "sold").length;
  const categories = new Set(products.map((p) => p.category)).size;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-8 md:px-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl text-white border border-white/10 bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700"
      >
        <div className="absolute inset-0 opacity-45 pointer-events-none">
          <motion.div
            className="inline-flex gap-3 h-full items-center px-4"
            style={{ width: "max-content" }}
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 36, ease: "linear" }}
          >
            {repeatedBrandReels.map((reel, index) => (
              <article
                key={`hero-${reel.src}-${index}`}
                className="relative w-[130px] md:w-[180px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/20 bg-black/80 flex-shrink-0"
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                  className="w-full h-full object-cover"
                >
                  <source src={reel.src} type="video/mp4" />
                </video>
              </article>
            ))}
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/55" />
        </div>

        <div className="space-y-3 flex-1 relative z-10">
          <div className="inline-flex items-center gap-2 text-xs md:text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">New arrivals daily</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">
            Find your next
            <br />
            <span className="text-yellow-300">favourite fit.</span>
          </h1>
          <p className="text-sm md:text-base text-white/90 max-w-md leading-relaxed">
            Shop unique thrift pieces from trusted sellers. Sustainable,
            budget-friendly, and one-of-one.
          </p>

          {/* Stats */}
          {showStats && (
            <div className="flex items-center gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalProducts}+</div>
                <div className="text-xs text-white/80">Active Items</div>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <div className="text-2xl font-bold">{soldItems}+</div>
                <div className="text-xs text-white/80">Items Sold</div>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <div className="text-2xl font-bold">{categories}+</div>
                <div className="text-xs text-white/80">Categories</div>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`font-bold text-lg md:text-xl ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {selectedCategory === "All Categories"
              ? "Trending Pieces"
              : selectedCategory}
          </h2>
          <div
            className={`flex items-center gap-2 mt-1 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>
              {availableProducts.length}{" "}
              {availableProducts.length === 1 ? "item" : "items"} available
            </span>
          </div>
        </div>

        {/* View Toggle (Future: Grid/List view) */}
        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded-lg transition ${
              isDarkMode
                ? "app-panel text-slate-300 hover:bg-slate-800"
                : "app-panel text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
            isDarkMode
              ? "bg-red-900/20 border-red-800/50 text-red-100"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div>
            <p className="text-sm font-semibold">Unable to load latest products</p>
            <p className="text-xs opacity-90 mt-1">{error}</p>
          </div>
          <button
            onClick={() => dispatch(fetchProducts())}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
              isDarkMode
                ? "bg-red-700 hover:bg-red-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {loading && products.length === 0 && !error && (
        <div
          className={`mt-10 flex items-center justify-center text-sm py-8 rounded-2xl border ${
            isDarkMode
              ? "bg-slate-900/30 border-slate-700 text-slate-300"
              : "bg-white/70 border-slate-200 text-slate-600"
          }`}
        >
          Loading products...
        </div>
      )}

      {/* Empty State */}
      {!loading && availableProducts.length === 0 ? (
        <div
          className={`mt-10 flex flex-col items-center justify-center text-center gap-4 py-16 rounded-3xl border-2 border-dashed ${
            isDarkMode
              ? "bg-slate-900/40 border-slate-700 text-slate-300"
              : "bg-white/70 border-slate-200 text-slate-600"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <Shirt
              className={`w-10 h-10 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />
          </div>
          <div>
            <p
              className={`text-base font-medium ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              No items in this category yet
            </p>
            <p
              className={`text-sm mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Be the first to list something amazing!
            </p>
          </div>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
          {availableProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Trending Banner (if more than 10 items) */}
      {availableProducts.length > 10 && (
        <div
          className={`mt-8 rounded-2xl p-6 flex items-center gap-4 ${
            isDarkMode
              ? "bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-800/40"
              : "bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100"
          }`}
        >
          <div
            className={`p-3 rounded-full ${
              isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100"
            }`}
          >
            <TrendingUp
              className={`w-6 h-6 ${
                isDarkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            />
          </div>
          <div>
            <h3
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              🔥 Trending Collection
            </h3>
            <p
              className={`text-sm mt-0.5 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              These items are getting lots of love from the community
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
