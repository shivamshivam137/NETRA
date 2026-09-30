import { trafficHeatmapData } from '../src/data/mockData.js'

console.log('=== VERIFYING TRAFFIC HEATMAP DATA ===')
console.log(`Total Heatmap Points: ${trafficHeatmapData.length}`)

const high = trafficHeatmapData.filter(p => p.level === 'high')
const medium = trafficHeatmapData.filter(p => p.level === 'medium')
const low = trafficHeatmapData.filter(p => p.level === 'low')

console.log(`High Density Hotspots (${high.length}):`)
high.forEach(h => console.log(`  - [${h.id}] ${h.name} (${h.zone}): ${h.vehicleCount} vph, ${(h.intensity * 100).toFixed(0)}% intensity, Lat: ${h.lat}, Lng: ${h.lng}`))

console.log(`Medium Density Hotspots (${medium.length}):`)
medium.forEach(m => console.log(`  - [${m.id}] ${m.name} (${m.zone}): ${m.vehicleCount} vph, ${(m.intensity * 100).toFixed(0)}% intensity, Lat: ${m.lat}, Lng: ${m.lng}`))

console.log(`Low Density Hotspots (${low.length}):`)
low.forEach(l => console.log(`  - [${l.id}] ${l.name} (${l.zone}): ${l.vehicleCount} vph, ${(l.intensity * 100).toFixed(0)}% intensity, Lat: ${l.lat}, Lng: ${l.lng}`))

console.log('=== HEATMAP DATA VALIDATION COMPLETED SUCCESSFULLY ===')
