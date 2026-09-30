import { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    liveMap: 'Live Map',
    vehicles: 'Vehicles',
    alerts: 'Alerts',
    analytics: 'Analytics',
    trafficPrevention: 'Traffic Prevention',
    settings: 'Settings',
    navigation: 'Navigation',
    urbanCommandCenter: 'Urban Command Center',
    streamEngine: 'Stream Engine',

    // TopHeader
    systemOnline: 'System Online',
    headerSubtitle: 'Real-time urban surveillance & traffic telemetry',
    priorityAlerts: 'Priority Alerts',
    unresolved: 'Unresolved',
    viewAllAlerts: 'View All Alerts in Incident Center',
    operatorProfile: 'Operator Profile',
    sectorCommand: 'Sector Command',
    commandDashboard: 'Command Dashboard',
    liveSurveillanceGrid: 'Live Surveillance Grid',
    systemPreferences: 'System Preferences',
    signOut: 'Sign Out of Session',

    // Dashboard & KPIs
    citySurveillanceOps: 'City Surveillance Operations',
    totalVehicles: 'Total Vehicles',
    detectedToday: 'Detected today',
    activeCameras: 'Active Cameras',
    operational: 'operational',
    activeAlerts: 'Active Alerts',
    critical: 'Critical',
    immediate: 'Immediate',
    trafficDensity: 'Traffic Density',
    corridor: 'NH-48 Corridor',
    peakHours: 'Peak Hours',
    averageSpeed: 'Average Speed',
    acrossNetwork: 'Across network',
    congestionZones: 'Congestion Zones',
    monitored: 'Monitored',
    trafficFlowTelemetry: 'Traffic Flow Telemetry',
    hourlyThroughput: 'Hourly vehicle throughput & corridor speed',
    cameraHealthStatus: 'Camera Health Status',
    anprGridDiagnostics: 'ANPR Grid Diagnostics',
    livePolling: 'Live Polling',
    onlineFeeds: 'Online Feeds',
    warningLatency: 'Warning / High Latency',
    offlineNodes: 'Offline Nodes',
    volume: 'Volume',
    speed: 'Speed',
    recentAlerts: 'Recent Alerts',

    // Settings
    systemSettings: 'System Settings',
    settingsSubtitle: 'Configure monitoring and interface preferences',
    defaults: 'Defaults',
    saveChanges: 'Save Changes',
    settingsSavedNotice: 'Settings saved successfully',
    systemStatus: 'System Status',
    monitoringStatus: 'Monitoring Status',
    monitoringDesc: 'Master switch for all telemetry feeds and ANPR correlation',
    monitoringActive: 'Monitoring Active',
    monitoringPaused: 'Monitoring Paused',
    mapDisplaySettings: 'Map Display Settings',
    showCameraMarkers: 'Show Camera Markers',
    showCameraMarkersDesc: 'Display ANPR sensor nodes on GIS map',
    showCameraLabels: 'Show Camera Labels',
    showCameraLabelsDesc: 'Render name labels next to camera nodes',
    showTrafficDensity: 'Show Traffic Density',
    showTrafficDensityDesc: 'Overlay density heatmap layer on map',
    autoCenterMap: 'Auto Center Map',
    autoCenterMapDesc: 'Re-center map on latest detected activity',
    alertPreferences: 'Alert Preferences',
    criticalAlerts: 'Critical Alerts',
    criticalAlertsDesc: 'Highest priority — immediate response required',
    highPriorityAlerts: 'High Priority Alerts',
    highPriorityAlertsDesc: 'Significant incidents requiring prompt attention',
    mediumPriorityAlerts: 'Medium Priority Alerts',
    mediumPriorityAlertsDesc: 'Operational events to monitor and investigate',
    lowPriorityAlerts: 'Low Priority Alerts',
    lowPriorityAlertsDesc: 'Informational events and minor anomalies',
    dataRefreshInterval: 'Data Refresh Interval',
    refreshInterval: 'Refresh Interval',
    refreshIntervalDesc: 'Frequency of telemetry polling from the data layer',
    interfacePreferences: 'Interface Preferences',
    theme: 'Theme',
    themeDesc: 'Visual color scheme',
    density: 'Density',
    densityDesc: 'UI element spacing',
    language: 'Language',
    languageDesc: 'Display language',
    changesAppliedLocally: 'Changes are applied locally in React state for the current session.',
    connectedLocalPrototype: 'Connected (Local Prototype)',
    activeServerEngine: 'Active Server Engine:',

    // Vehicles & Trajectory
    search: 'Search',
    searchVehicle: 'Search Vehicle',
    monitoredVehicleFleet: 'Monitored Vehicle Fleet',
    viewTrajectory: 'View Trajectory',
    firstSeen: 'First Seen',
    lastSeen: 'Last Seen',
    camerasDetected: 'Cameras Detected',
    lastKnownLocation: 'Last Known Location',

    // Status
    online: 'Online',
    offline: 'Offline',
    warning: 'Warning',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    liveMap: 'लाइव मैप',
    vehicles: 'वाहन',
    alerts: 'अलर्ट्स',
    analytics: 'एनालिटिक्स',
    trafficPrevention: 'यातायात नियंत्रण',
    settings: 'सेटिंग्स',
    navigation: 'नेविगेशन',
    urbanCommandCenter: 'शहरी कमांड सेंटर',
    streamEngine: 'स्ट्रीम इंजन',

    // TopHeader
    systemOnline: 'सिस्टम ऑनलाइन',
    headerSubtitle: 'रीयल-टाइम शहरी निगरानी और यातायात टेलीमेट्री',
    priorityAlerts: 'प्राथमिकता अलर्ट्स',
    unresolved: 'अनसुलझे',
    viewAllAlerts: 'इंसिडेंट सेंटर में सभी अलर्ट देखें',
    operatorProfile: 'ऑपरेटर प्रोफाइल',
    sectorCommand: 'सेक्टर कमांड',
    commandDashboard: 'कमांड डैशबोर्ड',
    liveSurveillanceGrid: 'लाइव निगरानी ग्रिड',
    systemPreferences: 'सिस्टम प्राथमिकताएं',
    signOut: 'सत्र से साइन आउट करें',

    // Dashboard & KPIs
    citySurveillanceOps: 'शहर निगरानी संचालन',
    totalVehicles: 'कुल वाहन',
    detectedToday: 'आज पहचाने गए',
    activeCameras: 'सक्रिय कैमरे',
    operational: 'कार्यरत',
    activeAlerts: 'सक्रिय अलर्ट्स',
    critical: 'गंभीर',
    immediate: 'तत्काल',
    trafficDensity: 'यातायात घनत्व',
    corridor: 'NH-48 कॉरिडोर',
    peakHours: 'पीक आवर्स',
    averageSpeed: 'औसत गति',
    acrossNetwork: 'नेटवर्क में',
    congestionZones: 'जाम क्षेत्र',
    monitored: 'निगरानी में',
    trafficFlowTelemetry: 'यातायात प्रवाह टेलीमेट्री',
    hourlyThroughput: 'प्रति घंटा वाहन प्रवाह और गति',
    cameraHealthStatus: 'कैमरा स्वास्थ्य स्थिति',
    anprGridDiagnostics: 'ANPR ग्रिड डायग्नोस्टिक्स',
    livePolling: 'लाइव पोलिंग',
    onlineFeeds: 'ऑनलाइन फ़ीड्स',
    warningLatency: 'चेतावनी / उच्च विलंबता',
    offlineNodes: 'ऑफ़लाइन नोड्स',
    volume: 'मात्रा',
    speed: 'गति',
    recentAlerts: 'हालिया अलर्ट्स',

    // Settings
    systemSettings: 'सिस्टम सेटिंग्स',
    settingsSubtitle: 'निगरानी और इंटरफ़ेस प्राथमिकताएं कॉन्फ़िगर करें',
    defaults: 'डिफ़ॉल्ट',
    saveChanges: 'परिवर्तन सहेजें',
    settingsSavedNotice: 'सेटिंग्स सफलतापूर्वक सहेजी गईं',
    systemStatus: 'सिस्टम स्थिति',
    monitoringStatus: 'निगरानी स्थिति',
    monitoringDesc: 'सभी टेलीमेट्री फ़ीड और ANPR सहसंबंध के लिए मास्टर स्विच',
    monitoringActive: 'निगरानी सक्रिय',
    monitoringPaused: 'निगरानी रोकी गई',
    mapDisplaySettings: 'मानचित्र प्रदर्शन सेटिंग्स',
    showCameraMarkers: 'कैमरा मार्कर दिखाएं',
    showCameraMarkersDesc: 'GIS मानचित्र पर ANPR सेंसर नोड्स प्रदर्शित करें',
    showCameraLabels: 'कैमरा लेबल दिखाएं',
    showCameraLabelsDesc: 'कैमरा नोड्स के पास नाम लेबल दिखाएं',
    showTrafficDensity: 'यातायात घनत्व दिखाएं',
    showTrafficDensityDesc: 'मानचित्र पर घनत्व हीटमैप परत दिखाएं',
    autoCenterMap: 'मानचित्र स्वतः केंद्रित करें',
    autoCenterMapDesc: 'नवीनतम पहचानी गई गतिविधि पर मानचित्र केंद्रित करें',
    alertPreferences: 'अलर्ट प्राथमिकताएं',
    criticalAlerts: 'गंभीर अलर्ट्स',
    criticalAlertsDesc: 'उच्चतम प्राथमिकता — तत्काल प्रतिक्रिया आवश्यक',
    highPriorityAlerts: 'उच्च प्राथमिकता अलर्ट्स',
    highPriorityAlertsDesc: 'महत्वपूर्ण घटनाएं जिन पर तुरंत ध्यान देना आवश्यक है',
    mediumPriorityAlerts: 'मध्यम प्राथमिकता अलर्ट्स',
    mediumPriorityAlertsDesc: 'निगरानी और जांच के लिए परिचालन घटनाएं',
    lowPriorityAlerts: 'कम प्राथमिकता अलर्ट्स',
    lowPriorityAlertsDesc: 'सूचनात्मक घटनाएं और मामूली विसंगतियां',
    dataRefreshInterval: 'डेटा रिफ्रेश अंतराल',
    refreshInterval: 'रिफ्रेश अंतराल',
    refreshIntervalDesc: 'डेटा परत से टेलीमेट्री पोलिंग की आवृत्ति',
    interfacePreferences: 'इंटरफ़ेस प्राथमिकताएं',
    theme: 'थीम',
    themeDesc: 'दृश्य रंग योजना',
    density: 'घनत्व',
    densityDesc: 'UI तत्व रिक्ति',
    language: 'भाषा',
    languageDesc: 'प्रदर्शन भाषा',
    changesAppliedLocally: 'परिवर्तन वर्तमान सत्र के लिए स्थानीय रूप से लागू हैं।',
    connectedLocalPrototype: 'कनेक्टेड (स्थानीय प्रोटोटाइप)',
    activeServerEngine: 'सक्रिय सर्वर इंजन:',

    // Vehicles & Trajectory
    search: 'खोजें',
    searchVehicle: 'वाहन खोजें',
    monitoredVehicleFleet: 'निगरानी योग्य वाहन बेड़ा',
    viewTrajectory: 'प्रक्षेपवक्र देखें',
    firstSeen: 'पहली बार देखा गया',
    lastSeen: 'अंतिम बार देखा गया',
    camerasDetected: 'पहचाने गए कैमरे',
    lastKnownLocation: 'अंतिम ज्ञात स्थान',

    // Status
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    warning: 'चेतावनी',
  },
}

const LanguageContext = createContext({
  language: 'English',
  setLanguage: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('English')

  const t = (key) => {
    const langCode = language === 'Hindi' || language === 'hi' ? 'hi' : 'en'
    return translations[langCode]?.[key] || translations.en?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
