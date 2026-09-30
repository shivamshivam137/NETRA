import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '..', 'src')

console.log('=== VERIFYING LANGUAGE SWITCHING MECHANISM ===\n')

// 1. Check LanguageContext.jsx
console.log('1. Checking LanguageContext.jsx structure and dictionaries:')
const langContextPath = path.join(srcDir, 'context', 'LanguageContext.jsx')
const langContextContent = fs.readFileSync(langContextPath, 'utf8')

const requiredKeys = [
  'dashboard',
  'liveMap',
  'vehicles',
  'alerts',
  'analytics',
  'settings',
  'systemSettings',
  'monitoringStatus',
  'saveChanges',
  'settingsSavedNotice',
  'totalVehicles',
  'activeCameras',
  'trafficDensity',
  'recentAlerts',
  'online',
  'offline',
  'warning',
]

for (const key of requiredKeys) {
  if (langContextContent.includes(`${key}:`)) {
    console.log(`   ✓ Found key in translations: ${key}`)
  } else {
    console.error(`   ❌ Missing translation key: ${key}`)
    process.exit(1)
  }
}

// 2. Check main.jsx LanguageProvider wrapper
console.log('\n2. Checking main.jsx LanguageProvider wrapper:')
const mainContent = fs.readFileSync(path.join(srcDir, 'main.jsx'), 'utf8')
if (mainContent.includes('LanguageProvider')) {
  console.log('   ✓ LanguageProvider wraps App in main.jsx')
} else {
  console.error('   ❌ LanguageProvider missing in main.jsx')
  process.exit(1)
}

// 3. Check Settings.jsx Language integration
console.log('\n3. Checking Settings.jsx language dropdown:')
const settingsContent = fs.readFileSync(path.join(srcDir, 'pages', 'Settings.jsx'), 'utf8')
const hasEnglish = settingsContent.includes("value: 'English'")
const hasHindi = settingsContent.includes("value: 'Hindi'")
const hasUseLanguage = settingsContent.includes('useLanguage')

console.log(`   English option: ${hasEnglish ? '✓' : '❌'}`)
console.log(`   Hindi option: ${hasHindi ? '✓' : '❌'}`)
console.log(`   useLanguage hook: ${hasUseLanguage ? '✓' : '❌'}`)

if (!hasEnglish || !hasHindi || !hasUseLanguage) {
  console.error('❌ Settings.jsx language integration incomplete')
  process.exit(1)
}

// 4. Check Sidebar.jsx translation integration
console.log('\n4. Checking Sidebar.jsx navigation translations:')
const sidebarContent = fs.readFileSync(path.join(srcDir, 'components', 'layout', 'Sidebar.jsx'), 'utf8')
if (sidebarContent.includes("t('dashboard')") && sidebarContent.includes("t('settings')")) {
  console.log('   ✓ Sidebar uses t() for navigation labels')
} else {
  console.error('   ❌ Sidebar missing t() integration')
  process.exit(1)
}

// 5. Check TopHeader.jsx translation integration
console.log('\n5. Checking TopHeader.jsx translations:')
const headerContent = fs.readFileSync(path.join(srcDir, 'components', 'layout', 'TopHeader.jsx'), 'utf8')
if (headerContent.includes("t('systemOnline')")) {
  console.log('   ✓ TopHeader uses t() for header text')
} else {
  console.error('   ❌ TopHeader missing t() integration')
  process.exit(1)
}

console.log('\n==================================================')
console.log('ALL LANGUAGE SWITCHING CHECKS PASSED!')
console.log('==================================================')
