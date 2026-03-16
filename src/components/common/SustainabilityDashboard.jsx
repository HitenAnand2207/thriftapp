// src/components/common/SustainabilityDashboard.jsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { 
  Leaf, 
  Droplets, 
  Trees, 
  Award, 
  TrendingUp,
  Sparkles,
  Heart,
  Globe
} from 'lucide-react';
import {
  calculateTotalImpact,
  getAchievementLevel,
  getEnvironmentalFact,
  formatCO2,
  formatWater,
  getComparisonMetrics
} from '../../utils/sustainabilityUtils';

/**
 * Full sustainability dashboard showing user's environmental impact
 * Shows on Order History page or as a separate page
 */
const SustainabilityDashboard = () => {
  const { isDarkMode } = useTheme();
  const { products } = useSelector((state) => state.products);

  // Get all sold/purchased items (in real app, this would be orders)
  const purchasedItems = useMemo(() => {
    return products.filter(p => p.status === 'sold');
  }, [products]);

  const impact = useMemo(() => {
    return calculateTotalImpact(purchasedItems);
  }, [purchasedItems]);

  const achievement = getAchievementLevel(impact.co2);
  const fact = getEnvironmentalFact(impact.co2);
  const comparisons = getComparisonMetrics(impact.co2);

  if (purchasedItems.length === 0) {
    return (
      <div className={`rounded-2xl p-8 text-center ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
          isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
        }`}>
          <Leaf className={`w-8 h-8 ${
            isDarkMode ? 'text-green-400' : 'text-green-600'
          }`} />
        </div>
        <h3 className={`text-lg font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Start Your Sustainability Journey
        </h3>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Every thrifted item you buy helps save the planet!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievement Badge */}
      <div className={`rounded-3xl p-6 border-2 ${
        isDarkMode
          ? 'bg-gradient-to-br from-purple-900/50 to-green-900/50 border-purple-800/30'
          : 'bg-gradient-to-br from-purple-50 via-green-50 to-emerald-50 border-purple-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-4xl ${
              isDarkMode ? 'filter brightness-110' : ''
            }`}>
              {achievement.emoji}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {achievement.level}
              </h3>
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {purchasedItems.length} items thrifted
              </p>
            </div>
          </div>
          <Award className={`w-8 h-8 ${
            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
          }`} />
        </div>

        {/* Progress to next level */}
        <div className="mt-4">
          <div className={`flex items-center justify-between text-xs mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>Keep thrifting to level up!</span>
            <span>{formatCO2(impact.co2)}</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-500"
              style={{ width: `${Math.min((impact.co2 / 500) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* CO2 Saved */}
        <div className={`rounded-2xl p-5 border ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`inline-flex p-3 rounded-xl mb-3 ${
            isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
          }`}>
            <Leaf className={`w-6 h-6 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          <p className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {formatCO2(impact.co2)}
          </p>
          <p className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            CO2 Emissions Saved
          </p>
        </div>

        {/* Water Saved */}
        <div className={`rounded-2xl p-5 border ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`inline-flex p-3 rounded-xl mb-3 ${
            isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
            <Droplets className={`w-6 h-6 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          <p className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {formatWater(impact.water)}L
          </p>
          <p className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Water Conserved
          </p>
        </div>

        {/* Trees Equivalent */}
        <div className={`rounded-2xl p-5 border ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`inline-flex p-3 rounded-xl mb-3 ${
            isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'
          }`}>
            <Trees className={`w-6 h-6 ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`} />
          </div>
          <p className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {impact.trees}
          </p>
          <p className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Tree-Years Absorbed
          </p>
        </div>

        {/* Plastic Bottles */}
        <div className={`rounded-2xl p-5 border ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`inline-flex p-3 rounded-xl mb-3 ${
            isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
          }`}>
            <Globe className={`w-6 h-6 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <p className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {impact.plastic}
          </p>
          <p className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Plastic Bottles Worth
          </p>
        </div>
      </div>

      {/* Fun Fact */}
      <div className={`rounded-2xl p-5 border ${
        isDarkMode
          ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-800/30'
          : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{fact.icon}</span>
          <div className="flex-1">
            <p className={`text-xs font-semibold mb-1 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-800'
            }`}>
              Did You Know?
            </p>
            <p className={`text-sm ${
              isDarkMode ? 'text-yellow-200' : 'text-yellow-900'
            }`}>
              {fact.fact}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Metrics */}
      <div className={`rounded-2xl p-6 border ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <TrendingUp className="w-5 h-5 text-green-600" />
          Your Impact Equals
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {comparisons.smartphones}
            </p>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              📱 Phone Charges
            </p>
          </div>

          <div className="text-center">
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {comparisons.miles}
            </p>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              🚗 Car-Free Miles
            </p>
          </div>

          <div className="text-center">
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {comparisons.coffees}
            </p>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ☕ Cups of Coffee
            </p>
          </div>

          <div className="text-center">
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              {comparisons.trees}
            </p>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              🌳 Trees Planted
            </p>
          </div>
        </div>
      </div>

      {/* Share Achievement */}
      <div className={`rounded-2xl p-5 text-center border ${
        isDarkMode
          ? 'bg-gradient-to-r from-pink-900/30 to-purple-900/30 border-pink-800/30'
          : 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200'
      }`}>
        <Heart className={`w-6 h-6 mx-auto mb-2 ${
          isDarkMode ? 'text-pink-400' : 'text-pink-600'
        }`} />
        <p className={`text-sm font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Share your sustainability journey with friends!
        </p>
        <button className={`mt-3 px-6 py-2 rounded-xl text-sm font-medium transition ${
          isDarkMode
            ? 'bg-pink-600 hover:bg-pink-700 text-white'
            : 'bg-pink-600 hover:bg-pink-700 text-white'
        }`}>
          <Sparkles className="w-4 h-4 inline mr-2" />
          Share Impact
        </button>
      </div>
    </div>
  );
};

export default SustainabilityDashboard;