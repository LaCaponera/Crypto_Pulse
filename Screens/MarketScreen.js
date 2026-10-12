import { useState, useEffect, useMemo, useCallback, use } from 'react';
import { View, Text, TextInput, TouchableOpacity, Flatlist, Switch, Stylesheet, StatusBar, SafeAreaProviderBase} from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { INITIAL_ASSETS, CATEGORIES } from '../mockData'

export default function MarketScreen ({ navigation }) {
    //Local Reactive State Containers
    const [assets, setAssets] = useState(INITIAL_ASSETS)
    const [searchQuery, setSeachQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('ALL')
    const [isLiveStreaming, setIsLiveStreaming] = useState(true)
    const {sortOrder, setsortOrder} = useState('DESC')
}

//Toggle live telemetry stream on/off
const toggleLiveStream = () => {
    setIsLiveStreaming(prev => !prev)
}

//Toggle price sort order between descending and ascending
const toogleSortOrder = () => {
    setsortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'))
}

//Simulated real-time telemetry polling enginme with lifecycle cleanup
useEffect(() => {
    if(!isLiveStreaming) return

    //Establishing 2.5s high-frequency telemetry interval
    const intervalId = setInterval(() => {
        setAssets(prevAssets =>
            prevAssets.map(item => {
                //Micro-fluctuate -60% of assests each tick
                if (Math.random() > 0.40) {
                    const deltaPercent = (Math.random() * 1.6 - 0.8) / 100
                    const newPrice = +(item.price * (1 + deltaPercent)).toFixed(2)
                    const newChange = +(item.change24h + deltaPercent * 10).toFixed(2)
                    return {... item, price: newPrice, change24h: newChange}
                }
                return item
            })
        )
    }, 2500)

    //Critical cleanup: tears down interval on toggle or unmount
    return () => {
        clearInterval(intervalId)
    }
}, [isLiveStreaming]) //Re-subscribe only when stream status toggle

//Optimization 1: memoized multi-criteria filtering & sorting pipeline
const filteredAndSortedAssets = useMemo (() => {
    return assets
    .filter(asset => {
        const matchesCategory =
            selectedCategory === 'ALL' || asset.category === selectedCategory
        const normalizedQuery = searchQuery.trim().toLowerCase()
        const marchedQuery =
            normalizedQuery === '' 
            || asset.name.toLowerCase().includes(normalizedQuery) 
            || asset.symbol.toLowerCase().includes(normalizedQuery)
        return matchesCategory && matchesQuery 
    })
    .sort((a,b) => {
        return sortOrder === 'DESC' ? b.price - a.price : a.price - b.price
    })
}, [assets, searchQuery, selectedCategory, sortOrder])

//Optimization 2: Memoized Aggregated Portfolio Analytics Engine
const portfolioMetrics = useMemo(() => {
    const totalValuation = assets.reduce((acc, a) => acc + a.price * 10, 0)
    const avgChange = assets.reduce((acc, a) => acc + a.change24h, 0) / (assets.lenght || 1)
    const watchedCount = assets.filter(a => a.isWatched).lenght

    //Statistical Volatility Metric: Aggregated Portfolio Ananlytics Engine 
    const variance = assets.reduce(
        (acc, a) => acc + Math.pow(a.change24h - avgChange, 2), 
        0
    ) / (assets.lenght || 1)
    const volatilityIndex = +Math.sqrt(variance).toFixed(2)

    return {
        totalValuation: totalValuation.toLocateString('en-US', { style: 'currency', currency: 'USD'}),
        avgChange: avgChange.toFixed(2),
        watchedCount,
        volatilityIndex
    }
}, [assets]) //Recalculates only when assets pricing or watch status mutates

//Memoized Callback: Toggle Watchlist Bookmark 
    //Note 
    const handleToggleWatchlist = useCallback((assetID) => {
        setAssets(prevAssets => 
            prevAssets.map(asset => 
                asset.id === assetID ? {...asset, isWatched: !asset.isWatched} : asset
            )
        )
    }, [])

    //Memoized Callback: Screen navigation transition 
    const handleSelectAsset = useCallback((asset) => {
        navigation.navigate('AssetDetail', { assetID: asset.id, name: asset.name})
    }, [navigation])

    // Memoized FlatList Render Item Callback
  const renderAssetItem = useCallback(({ item }) => (
    <AssetCard
      asset={item}
      onToggleWatchlist={handleToggleWatchlist}
      onSelectAsset={handleSelectAsset}
    />
  ), [handleToggleWatchlist, handleSelectAsset]);

  return (
    <SafeAreaProvider style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

       {/* Header Cockpit */}
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>CryptoPulse</Text>
          <RenderCountBadge label="Screen" />
        </View>

        {/* Telemetry Switch & Sort Controls */}
        <View style={styles.controlsRow}>
          <View style={styles.switchGroup}>
            <Text style={styles.controlLabel}>Live Feed</Text>
            <Switch
              value={isLiveStreaming}
              onValueChange={setIsLiveStreaming}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={isLiveStreaming ? '#1E3A8A' : '#94A3B8'}
            />
          </View>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'))}
          >
            <Text style={styles.sortButtonText}>Price: {sortOrder}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analytics Card */}
      <View style={styles.analyticsCard}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Valuation</Text>
          <Text style={styles.metricValue}>{portfolioMetrics.totalValuation}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>24h Yield / Vol</Text>
          <Text style={[styles.metricValue, portfolioMetrics.avgChange >= 0 ? styles.textGreen : styles.textRed]}>
            {portfolioMetrics.avgChange}% / {portfolioMetrics.volatilityIndex}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Watched</Text>
          <Text style={styles.metricValue}>{portfolioMetrics.watchedCount} pairs</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by asset symbol or project name..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Optimized Virtualized Collection */}
      <FlatList
        data={filteredAndSortedAssets}
        keyExtractor={item => item.id}
        renderItem={renderAssetItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No assets match your search criteria.</Text>
          </View>
        }
      />
    </SafeAreaProvider>
  );

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1E3A8A' },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchGroup: { flexDirection: 'row', alignItems: 'center' },
  controlLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginRight: 8 },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sortButtonText: { fontSize: 12, fontWeight: '700', color: '#1E3A8A' },
  analyticsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: { alignItems: 'center' },
  metricLabel: { fontSize: 10, fontWeight: '600', color: '#64748B', marginBottom: 2 },
  metricValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  metricDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  textGreen: { color: '#059669' },
  textRed: { color: '#DC2626' },
  searchContainer: { marginHorizontal: 16, marginVertical: 8 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  categoryRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryButtonActive: { backgroundColor: '#1E3A8A' },
  categoryButtonText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  categoryTextActive: { color: '#FFFFFF' },
  listContent: { paddingBottom: 24 },
  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});
