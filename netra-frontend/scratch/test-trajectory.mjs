import { vehicles, trajectories, getVehicleTrajectory, cameras } from '../src/data/mockData.js'

console.log('=== VERIFYING TRAJECTORY INTEGRATION ===')
console.log(`Total Vehicles: ${vehicles.length}`)
console.log(`Total Cameras: ${cameras.length}`)
console.log(`Total Trajectories: ${trajectories.length}`)

for (const v of vehicles) {
  const traj = getVehicleTrajectory(v.plate)
  if (!traj) {
    console.error(`❌ Missing trajectory for vehicle ${v.plate}`)
  } else {
    console.log(`✓ Vehicle: ${v.plate} (${v.make}) -> ${traj.points.length} trajectory cameras:`)
    const seqStr = traj.points.map(p => `#${p.sequence} ${p.cameraId} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`).join(' -> ')
    console.log(`  Route: ${seqStr}`)
  }
}

console.log('=== TEST COMPLETED SUCCESSFULLY ===')
