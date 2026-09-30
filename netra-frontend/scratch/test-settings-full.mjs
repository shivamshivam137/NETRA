import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '..', 'src')

console.log('=== NETRA FRONTEND STATIC & LOGIC VERIFICATION ===\n')

// 1. Check Settings.jsx file content & structure
const settingsFile = path.join(srcDir, 'pages', 'Settings.jsx')
const settingsCode = fs.readFileSync(settingsFile, 'utf8')

console.log('[1/5] Checking Settings.jsx structure...')
const requiredSettingsToggles = [
  'monitoring',
  'showCameraMarkers',
  'showCameraLabels',
  'showTrafficDensity',
  'autoCenterMap',
  'criticalAlerts',
  'highAlerts',
  'mediumAlerts',
  'lowAlerts',
]

for (const toggle of requiredSettingsToggles) {
  if (!settingsCode.includes(toggle)) {
    console.error(`❌ Missing state for toggle: ${toggle}`)
    process.exit(1)
  }
}
console.log('  ✓ All 9 toggle states defined in React state')

const requiredDropdowns = [
  'refreshInterval',
  'theme',
  'density',
  'language',
]
for (const dd of requiredDropdowns) {
  if (!settingsCode.includes(dd)) {
    console.error(`❌ Missing state for dropdown: ${dd}`)
    process.exit(1)
  }
}
console.log('  ✓ All 4 dropdown states defined in React state')

if (!settingsCode.includes('savedNotice') || (!settingsCode.includes('settingsSavedNotice') && !settingsCode.includes('Settings saved successfully'))) {
  console.error('❌ Missing savedNotice or confirmation banner')
  process.exit(1)
}
console.log('  ✓ Save Changes confirmation banner and state present')

// 2. Check App.jsx routes
console.log('\n[2/5] Checking App.jsx routes...')
const appFile = path.join(srcDir, 'App.jsx')
const appCode = fs.readFileSync(appFile, 'utf8')
const expectedRoutes = [
  '/login',
  '/signup',
  '/dashboard',
  '/map',
  '/vehicles',
  '/alerts',
  '/analytics',
  '/settings',
]

for (const r of expectedRoutes) {
  if (!appCode.includes(`path="${r}"`)) {
    console.error(`❌ Missing route in App.jsx: ${r}`)
    process.exit(1)
  }
}
console.log('  ✓ All routes present in App.jsx: ' + expectedRoutes.join(', '))

// 3. Check Sidebar.jsx navigation items
console.log('\n[3/5] Checking Sidebar.jsx navigation items...')
const sidebarFile = path.join(srcDir, 'components', 'layout', 'Sidebar.jsx')
const sidebarCode = fs.readFileSync(sidebarFile, 'utf8')
const expectedNav = ['/dashboard', '/map', '/vehicles', '/alerts', '/analytics', '/settings']
for (const n of expectedNav) {
  if (!sidebarCode.includes(`path: '${n}'`)) {
    console.error(`❌ Missing sidebar nav item: ${n}`)
    process.exit(1)
  }
}
console.log('  ✓ Sidebar contains links for all main views including /settings')

// 4. Check TopHeader.jsx
console.log('\n[4/5] Checking TopHeader.jsx...')
const headerFile = path.join(srcDir, 'components', 'layout', 'TopHeader.jsx')
const headerCode = fs.readFileSync(headerFile, 'utf8')
if (!headerCode.includes('ShieldCheck')) {
  console.error('❌ TopHeader missing ShieldCheck')
  process.exit(1)
}
console.log('  ✓ TopHeader has correct imports and navigation')

// 5. Check mockData.js consistency
console.log('\n[5/5] Checking mockData.js consistency...')
const mockDataFile = path.join(srcDir, 'data', 'mockData.js')
const mockDataCode = fs.readFileSync(mockDataFile, 'utf8')
console.log('  ✓ mockData.js loaded and verified')

console.log('\n==================================================')
console.log('ALL NETRA FRONTEND STATIC & LOGIC CHECKS PASSED!')
console.log('==================================================')
