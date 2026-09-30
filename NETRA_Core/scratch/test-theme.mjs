import { applyTheme, getSystemTheme, getCurrentThemePreference } from '../src/utils/theme.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '..', 'src')

console.log('=== VERIFYING THEME SWITCHING MECHANISM ===\n')

// 1. Check theme utility functions
console.log('1. Checking getSystemTheme & getCurrentThemePreference:')
console.log('   getSystemTheme() =>', getSystemTheme())
console.log('   getCurrentThemePreference() =>', getCurrentThemePreference())

// 2. Check CSS definitions for light theme
console.log('\n2. Checking src/index.css for light theme rules:')
const cssContent = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf8')

const requiredCssRules = [
  '[data-theme="light"]',
  'html.light',
  'color-scheme: light',
  'background-color: #f1f5f9',
  'color: #0f172a',
]

for (const rule of requiredCssRules) {
  if (cssContent.includes(rule)) {
    console.log(`   ✓ Found rule: ${rule}`)
  } else {
    console.error(`   ❌ Missing rule: ${rule}`)
    process.exit(1)
  }
}

// 3. Check Settings.jsx theme integration
console.log('\n3. Checking Settings.jsx theme options:')
const settingsContent = fs.readFileSync(path.join(srcDir, 'pages', 'Settings.jsx'), 'utf8')
const hasDarkOption = settingsContent.includes("value: 'Dark'")
const hasLightOption = settingsContent.includes("value: 'Light'")
const hasSystemOption = settingsContent.includes("value: 'System'")
const hasApplyTheme = settingsContent.includes('applyTheme')

console.log(`   Dark option: ${hasDarkOption ? '✓' : '❌'}`)
console.log(`   Light option: ${hasLightOption ? '✓' : '❌'}`)
console.log(`   System option: ${hasSystemOption ? '✓' : '❌'}`)
console.log(`   applyTheme invoked: ${hasApplyTheme ? '✓' : '❌'}`)

if (!hasDarkOption || !hasLightOption || !hasSystemOption || !hasApplyTheme) {
  console.error('❌ Theme integration incomplete in Settings.jsx')
  process.exit(1)
}

console.log('\n==================================================')
console.log('ALL THEME SWITCHING CHECKS PASSED SUCCESSFULLY!')
console.log('==================================================')
