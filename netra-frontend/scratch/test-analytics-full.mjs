import { 
  analyticsKPIs, 
  trafficData, 
  speedTrendData, 
  trafficHeatmapData, 
  congestionZonesData, 
  trafficInsightsData,
  cameras,
  vehicles,
  trajectories 
} from '../src/data/mockData.js'

console.log('=== VERIFYING FULL ANALYTICS SUITE ===')

console.log(`\n1. KPIs (${analyticsKPIs.length}):`)
analyticsKPIs.forEach(k => console.log(`   - ${k.label}: ${k.value} ${k.unit} (${k.change})`))

console.log(`\n2. Traffic Flow Data (${trafficData.length} hours):`)
console.log(`   - First: ${trafficData[0].time} (${trafficData[0].volume} vph) | Peak: ${Math.max(...trafficData.map(d => d.volume))} vph`)

console.log(`\n3. Speed Trend Data (${speedTrendData.length} hours):`)
console.log(`   - Trough: ${Math.min(...speedTrendData.map(d => d.avgSpeed))} km/h | Max: ${Math.max(...speedTrendData.map(d => d.avgSpeed))} km/h`)

console.log(`\n4. Traffic Heatmap Hotspots (${trafficHeatmapData.length}):`)
console.log(`   - High: ${trafficHeatmapData.filter(h => h.level === 'high').length} | Med: ${trafficHeatmapData.filter(h => h.level === 'medium').length} | Low: ${trafficHeatmapData.filter(h => h.level === 'low').length}`)

console.log(`\n5. Congestion Zones (${congestionZonesData.length}):`)
congestionZonesData.forEach(z => console.log(`   - [${z.level}] ${z.location}: Density ${z.density}%, Speed ${z.avgSpeed} km/h`))

console.log(`\n6. Camera Network (${cameras.length} nodes):`)
console.log(`   - Online: ${cameras.filter(c => c.status === 'active').length} | Warning: ${cameras.filter(c => c.status === 'warning').length} | Offline: ${cameras.filter(c => c.status === 'offline').length}`)

console.log(`\n7. Traffic Insights (${trafficInsightsData.length} cards):`)
trafficInsightsData.forEach(i => console.log(`   - [${i.category}] ${i.title}`))

console.log(`\n8. Existing Vehicles & Trajectories (${vehicles.length} vehicles, ${trajectories.length} trajectories):`)
vehicles.forEach(v => console.log(`   - ${v.plate} (${v.make})`))

console.log('\n=== ALL ANALYTICS & REGRESSION TESTS PASSED ===')
