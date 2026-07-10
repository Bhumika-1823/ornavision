import React, { useEffect, useState } from 'react';
import { DeviceCompatibilityLab, CompatibilityReport } from '@/engine/testing/DeviceCompatibilityLab';

export default function DeviceLabPage() {
  const [report, setReport] = useState<CompatibilityReport | null>(null);

  useEffect(() => {
    // Run the lab automatically on mount
    const res = DeviceCompatibilityLab.run();
    setReport(res);
  }, []);

  if (!report) return <div className="p-8 text-white">Running Compatibility Lab...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <h1 className="text-3xl font-bold mb-8 text-yellow-400">Device Compatibility Lab</h1>
      
      <div className="space-y-6 max-w-3xl">
        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Hardware Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Assigned Tier:</span> <strong className="text-green-400 uppercase">{report.hardware.tier}</strong></div>
            <div><span className="text-gray-400">Device Memory:</span> {report.hardware.memoryGiB} GiB</div>
            <div><span className="text-gray-400">Concurrency:</span> {report.hardware.concurrency} cores</div>
            <div className="col-span-2"><span className="text-gray-400">User Agent:</span> {report.userAgent}</div>
          </div>
        </section>

        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Browser APIs</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">WebGL Available:</span> {report.apis.webgl ? '✅' : '❌'}</div>
            <div><span className="text-gray-400">Max Texture Size:</span> {report.apis.webglMaxTextureSize}px</div>
            <div><span className="text-gray-400">Media Devices (Camera):</span> {report.apis.getUserMedia ? '✅' : '❌'}</div>
            <div><span className="text-gray-400">Canvas 2D:</span> {report.apis.canvas2D ? '✅' : '❌'}</div>
          </div>
        </section>

        <section className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Render Engine Degradation</h2>
          <p className="text-sm text-gray-400 mb-4">Based on the hardware tier, the following rendering features have been toggled.</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Post-Process Bloom:</span> {report.features.bloom ? '✅ ENABLED' : '❌ DISABLED (Too heavy)'}</div>
            <div><span className="text-gray-400">Selfie Segmentation:</span> {report.features.segmentation ? '✅ ENABLED' : '❌ DISABLED'}</div>
            <div><span className="text-gray-400">High-Res Drop Shadows:</span> {report.features.highResShadows ? '✅ ENABLED' : '❌ HARD SHADOWS'}</div>
            <div><span className="text-gray-400">Material Reflections:</span> {report.features.reflections ? '✅ ENABLED' : '❌ MATTE ONLY'}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
