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

const PALETTE = {
  ruby: '#8F1D35',
  rubyDark: '#7A172C',
  gold: '#D9B66F',
  ivory: '#FFF9F1',
  espresso: '#332522',
  espressoMuted: '#5C433E',
  espressoSubtle: '#8C6C65',
  rose: '#F3E4E6',
  white: '#FFFFFF',
};

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
    title: 'SolarGen 1.5kVA Pure Sine Wave Portable Power Station',
    vendorName: 'Naija Volt Tech Solutions',
    category: 'Electronics & Gadgets',
    priceNGN: 460000,
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
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
  {
    id: 'prod_4',
    title: 'Smart 8L Multi-Tier Pressure Cooker & Food Steamer',
    vendorName: 'Continental Housewares NG',
    category: 'Home & Kitchen',
    priceNGN: 680000,
    imageUrl: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=400&q=80',
    rating: 4.8,
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
    {
      id: 'prod_2',
      title: 'SolarGen 1.5kVA Portable Power Station',
      priceNGN: 460000,
      vendor: 'Naija Volt Tech Solutions',
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
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.espresso} />

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Text style={styles.topBannerText}>
          🌍 Shop All Items Locally & Worldwide • International Cards Accepted
        </Text>
      </View>

      {/* Header with Shopping Cart next to GOJIFEM */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>G</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerTitle}>GOJIFEM</Text>
              <Text style={styles.logoCartIcon}>🛒</Text>
            </View>
            <Text style={styles.headerSubtitle}>GLOBAL MARKETPLACE</Text>
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
              placeholder="Search all items: tech, fashion, food, home..."
              placeholderTextColor={PALETTE.espressoSubtle}
              style={styles.searchInput}
            />
          </View>

          {/* Escrow Badge */}
          <View style={styles.escrowCard}>
            <Text style={styles.escrowTitle}>★ SHOP ALL KINDS OF ITEMS LOCALLY & WORLDWIDE</Text>
            <Text style={styles.escrowDesc}>
              Electronics, fashion, groceries, home appliances & crafts. 100% buyer escrow protection.
            </Text>
          </View>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
            {['All', 'Electronics', 'Fashion', 'Groceries', 'Home & Kitchen', 'Hardware', 'Books'].map((cat, i) => (
              <View key={cat} style={[styles.catChip, i === 0 && styles.catChipActive]}>
                <Text style={[styles.catChipText, i === 0 && styles.catChipTextActive]}>{cat}</Text>
              </View>
            ))}
          </ScrollView>

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
          <Text style={styles.sectionTitle}>Multi-Vendor Shopping Cart ({cart.length})</Text>

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
              <Text style={styles.packageVendor}>Package 2: Naija Volt Tech Solutions</Text>
              <Text style={styles.packageItems}>1x SolarGen 1.5kVA Portable Power Station</Text>
              <Text style={styles.packageStatus}>Status: Dispatched via Red Star Express</Text>
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
    backgroundColor: PALETTE.ivory,
  },
  topBanner: {
    backgroundColor: PALETTE.espresso,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  topBannerText: {
    color: PALETTE.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PALETTE.ivory,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.rose,
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
    backgroundColor: PALETTE.ruby,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: PALETTE.white,
    fontWeight: '900',
    fontSize: 18,
  },
  logoCartIcon: {
    fontSize: 15,
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 16,
    color: PALETTE.espresso,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 8,
    fontWeight: '800',
    color: PALETTE.gold,
    marginTop: -2,
    letterSpacing: 1,
  },
  currencySwitch: {
    flexDirection: 'row',
    backgroundColor: PALETTE.rose,
    borderRadius: 8,
    padding: 2,
  },
  currBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currBtnActive: {
    backgroundColor: PALETTE.white,
  },
  currText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.espressoSubtle,
  },
  currTextActive: {
    color: PALETTE.ruby,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.rose,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    color: PALETTE.espresso,
  },
  escrowCard: {
    backgroundColor: PALETTE.rose,
    borderWidth: 1,
    borderColor: PALETTE.gold,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  escrowTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.espresso,
    letterSpacing: 0.5,
  },
  escrowDesc: {
    fontSize: 10,
    color: PALETTE.espressoMuted,
    marginTop: 4,
    lineHeight: 14,
  },
  catChipsScroll: {
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.rose,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: PALETTE.ruby,
    borderColor: PALETTE.ruby,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.espresso,
  },
  catChipTextActive: {
    color: PALETTE.white,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.espresso,
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: PALETTE.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.rose,
    padding: 10,
    marginBottom: 12,
    gap: 12,
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: PALETTE.ivory,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.ruby,
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.espresso,
    marginTop: 2,
  },
  productVendor: {
    fontSize: 10,
    color: PALETTE.espressoSubtle,
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
    color: PALETTE.espresso,
  },
  addBtn: {
    backgroundColor: PALETTE.ruby,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtnText: {
    color: PALETTE.white,
    fontSize: 11,
    fontWeight: '800',
  },
  cartCard: {
    backgroundColor: PALETTE.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.rose,
    padding: 12,
    marginBottom: 10,
  },
  cartVendor: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.ruby,
  },
  cartTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.espresso,
    marginTop: 2,
  },
  cartPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: PALETTE.espresso,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: PALETTE.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.rose,
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
    color: PALETTE.espressoSubtle,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.espresso,
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: PALETTE.rose,
    paddingTop: 8,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: PALETTE.espresso,
  },
  summaryTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: PALETTE.espresso,
  },
  checkoutBtn: {
    backgroundColor: PALETTE.ruby,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  checkoutBtnText: {
    color: PALETTE.white,
    fontSize: 12,
    fontWeight: '800',
  },
  trackingCard: {
    backgroundColor: PALETTE.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.rose,
    padding: 16,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: PALETTE.espresso,
  },
  paymentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.espresso,
    backgroundColor: PALETTE.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 12,
  },
  packageBox: {
    backgroundColor: PALETTE.ivory,
    borderWidth: 1,
    borderColor: PALETTE.rose,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  packageVendor: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.espresso,
  },
  packageItems: {
    fontSize: 10,
    color: PALETTE.espressoSubtle,
    marginTop: 2,
  },
  packageStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.ruby,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.ivory,
    borderTopWidth: 1,
    borderTopColor: PALETTE.rose,
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: PALETTE.ruby,
    marginTop: -2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.espressoSubtle,
  },
  tabTextActive: {
    color: PALETTE.ruby,
  },
});
