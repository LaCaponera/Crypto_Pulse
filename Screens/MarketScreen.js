import { useState, useEffect, useMemo, useCallback, use } from 'react';
import { View, Text, TextInput, TouchableOpacity, Flatlist, Switch, Stylesheet, SafeAreaView, StatusBar } from 'react-native'
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
    setsortOrder(prev => (prev === 'DESC' ? 'ASC' ? : 'DESC'))
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
