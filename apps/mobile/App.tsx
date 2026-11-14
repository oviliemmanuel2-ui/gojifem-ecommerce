import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
} from 'react-native';

const MOCK_PRODUCTS = [
  {
    id: 'prod_1',
    title: 'Handcrafted Luxury Aso-Oke Agbada & Fila Set',
    vendorName: 'Omo Odua Heritage Looms',
    category: 'Fashion & Apparel',
    priceNGN: 145000,
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
  },
  {
    id: 'prod_2',
    title: '100% Organic Raw Nigerian Shea Butter (500g)',
    vendorName: 'Sahel Naturals Organic Co.',
    category: 'Beauty & Wellness',
    priceNGN: 4800,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-0d414a1c5d9a?auto=format&fit=crop&w=400&q=80',
    rating: 4.8,
  },
  {
    id: 'prod_3',
    title: 'Oron Sun-Dried Premium Crayfish (2kg Pack)',
    vendorName: 'Akwa Ibom Coastal Harvests',
    category: 'Nigerian Groceries',
    priceNGN: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
    rating: 5.0,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'shop' | 'cart' | 'tracking'>('shop');
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP'>('NGN');
  const [cart, setCart] = useState<{ id: string; title: string; priceNGN: number; vendor: string }[]>([
    {
      id: 'prod_1',
      title: 'Handcrafted Luxury Aso-Oke Agbada Set',
      priceNGN: 145000,
      vendor: 'Omo Odua Heritage Looms',
    },
  ]);

  const formatPrice = (ngn: number) => {
    if (currency === 'USD') return `$${(ngn * 0.000625).toFixed(2)}`;
    if (currency === 'GBP') return `£${(ngn * 0.00048).toFixed(2)}`;
    return `₦${ngn.toLocaleString()}`;
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.priceNGN, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Text style={styles.topBannerText}>
          🌍 International Cards Accepted • Doorstep Delivery in Nigeria
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>G</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>GOJIFEM</Text>
            <Text style={styles.headerSubtitle}>MARKETPLACE</Text>
          </View>
        </View>

        {/* Currency Switcher */}
        <View style={styles.currencySwitch}>
          {(['NGN', 'USD', 'GBP'] as const).map((curr) => (
            <TouchableOpacity
              key={curr}
              onPress={() => setCurrency(curr)}
              style={[styles.currBtn, currency === curr && styles.currBtnActive]}
            >
              <Text style={[styles.currText, currency === curr && styles.currTextActive]}>
                {curr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content Area */}
      {activeTab === 'shop' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search products, brands, or verified vendors..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
          </View>

          {/* Escrow Badge */}
          <View style={styles.escrowCard}>
            <Text style={styles.escrowTitle}>🛡️ 100% Verified Merchant Escrow</Text>
            <Text style={styles.escrowDesc}>
              Pay from abroad or locally with Visa/Mastercard. Vendors are paid only after verified courier receipt.
            </Text>
          </View>

          {/* Section Header */}
          <Text style={styles.sectionTitle}>Featured Marketplace Listings</Text>

          {/* Product Cards */}
          {MOCK_PRODUCTS.map((p) => (
            <View key={p.id} style={styles.productCard}>
              <Image source={{ uri: p.imageUrl }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productCategory}>{p.category.toUpperCase()}</Text>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {p.title}
                </Text>
                <Text style={styles.productVendor}>Sold by {p.vendorName}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{formatPrice(p.priceNGN)}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() =>
                      setCart((prev) => [
                        ...prev,
                        { id: p.id, title: p.title, priceNGN: p.priceNGN, vendor: p.vendorName },
                      ])
                    }
                  >
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'cart' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Multi-Vendor Cart ({cart.length})</Text>

          {cart.map((item, idx) => (
            <View key={idx} style={styles.cartCard}>
              <Text style={styles.cartVendor}>Dispatched by {item.vendor}</Text>
              <Text style={styles.cartTitle}>{item.title}</Text>
              <Text style={styles.cartPrice}>{formatPrice(item.priceNGN)}</Text>
            </View>
          ))}

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(cartTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery (Lagos State)</Text>
              <Text style={styles.summaryValue}>{formatPrice(2500)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Total Due</Text>
              <Text style={styles.summaryTotalValue}>{formatPrice(cartTotal + 2500)}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn}>
              <Text style={styles.checkoutBtnText}>
                Pay with Card via Paystack ({formatPrice(cartTotal + 2500)})
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === 'tracking' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Live Parcel Tracking</Text>

          <View style={styles.trackingCard}>
            <Text style={styles.orderNumber}>Order #GOJI-2026-849201</Text>
            <Text style={styles.paymentBadge}>Paid via International Card (Visa US)</Text>

            <View style={styles.packageBox}>
              <Text style={styles.packageVendor}>Package 1: Omo Odua Heritage Looms</Text>
              <Text style={styles.packageItems}>1x Luxury Aso-Oke Agbada & Fila Set</Text>
              <Text style={styles.packageStatus}>Status: In Transit (GIGL #NIG-88492)</Text>
            </View>

            <View style={styles.packageBox}>
              <Text style={styles.packageVendor}>Package 2: Sahel Naturals Organic Co.</Text>
              <Text style={styles.packageItems}>2x Raw Organic Shea Butter</Text>
              <Text style={styles.packageStatus}>Status: Vendor Packing</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('shop')}
          style={[styles.tabItem, activeTab === 'shop' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'shop' && styles.tabTextActive]}>
            🛍️ Shop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('cart')}
          style={[styles.tabItem, activeTab === 'cart' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>
            🛒 Cart ({cart.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tracking')}
          style={[styles.tabItem, activeTab === 'tracking' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'tracking' && styles.tabTextActive]}>
            📦 Tracking
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBanner: {
    backgroundColor: '#064e3b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  topBannerText: {
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 16,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
    marginTop: -2,
  },
  currencySwitch: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  currBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currBtnActive: {
    backgroundColor: '#ffffff',
  },
  currText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  currTextActive: {
    color: '#064e3b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
  },
  escrowCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  escrowTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  escrowDesc: {
    fontSize: 10,
    color: '#047857',
    marginTop: 4,
    lineHeight: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 12,
    gap: 12,
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  productVendor: {
    fontSize: 10,
    color: '#64748b',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  cartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  cartVendor: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  cartTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  cartPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  summaryTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  checkoutBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  trackingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  paymentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 12,
  },
  packageBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  packageVendor: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
  },
  packageItems: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  packageStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#059669',
    marginTop: -2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#059669',
  },
});
