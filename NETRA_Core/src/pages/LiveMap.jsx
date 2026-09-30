import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import MapView from '../components/map/MapView'
import { cameras as mockCameras } from '../data/mockData'
import { getCameras } from '../services/api'
import { Layers, Video, ShieldCheck, MapPin } from 'lucide-react'

export default function LiveMap() {
  const [cameraList, setCameraList] = useState(mockCameras)

  useEffect(() => {
    let isMounted = true
    getCameras().then(({ data }) => {
      if (isMounted && data && data.length > 0) {
        setCameraList(data)
      }
    })
    return () => { isMounted = false }
  }, [])

  const activeCount = cameraList.filter(c => c.status === 'active').length

  return (
    <DashboardLayout title="Live GIS Surveillance Map">
      <div className="space-y-4">
        {/* Sub-header info bar */}
        <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <MapPin size={16} />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Mumbai Metropolitan Region Grid</span>
              <p className="text-slate-400 text-[11px]">Real-time camera telemetric visualization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#060a14] border border-slate-800 text-slate-300">
              <span className="text-slate-500">Live Feeds:</span> <strong className="text-emerald-400">{activeCount} / {cameraList.length} Active</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#060a14] border border-slate-800 text-slate-300 hidden sm:block">
              <span className="text-slate-500">Projection:</span> <strong className="text-cyan-400">WGS84 / Web Mercator</strong>
            </div>
          </div>
        </div>

        {/* Full-bleed Map view reusing the exact same MapView component */}
        <MapView cameras={cameraList} fullHeight={true} />
      </div>
    </DashboardLayout>
  )
}
