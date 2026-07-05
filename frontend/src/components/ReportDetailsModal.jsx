import React from 'react'

export default function ReportDetailsModal({ report, type, onClose }) {
  if (!report) return null;

  const imageUrl = report.image ? (report.image.startsWith('/') ? `http://localhost:5000${report.image}` : report.image) : null;
  const dateField = type === 'lost' ? report.dateLost : report.dateFound;
  const formattedDate = new Date(dateField).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0d0d0d] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl my-8 relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-[#0d0d0d]/80 backdrop-blur-xl p-4 border-b border-white/10 flex justify-between items-center rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-white">Report Details</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-2">✕</button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Section */}
            <div className="w-full md:w-1/2 rounded-xl overflow-hidden bg-[#111111] border border-white/10 flex items-center justify-center min-h-[250px]">
              {imageUrl ? (
                <img src={imageUrl} alt={report.title} className="w-full h-full object-cover max-h-[400px]" />
              ) : (
                <div className="text-zinc-600 font-medium">No Image Provided</div>
              )}
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-bold text-white">{report.title}</h3>
                  <span className="text-xs font-medium text-white bg-white/10 px-2 py-1 rounded-full border border-white/10">
                    {report.status}
                  </span>
                </div>
                <span className="inline-block text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 mb-4">
                  {report.category}
                </span>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{report.description}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                    Date {type === 'lost' ? 'Lost' : 'Found'}
                  </p>
                  <p className="text-sm font-medium text-zinc-200">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                    Location {type === 'lost' ? 'Lost' : 'Found'}
                  </p>
                  <p className="text-sm font-medium text-zinc-200">{type === 'lost' ? report.locationLost : report.locationFound}</p>
                </div>
                
                {/* Found Item Specific Details */}
                {type === 'found' && report.custodyType && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Custody Type</p>
                    <p className="text-sm font-medium text-zinc-200 capitalize">{report.custodyType}</p>
                  </div>
                )}
                {type === 'found' && report.custodyType === 'deposited' && report.landmark && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Deposited At (Landmark)</p>
                    <p className="text-sm font-medium text-zinc-200">{report.landmark}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end bg-black/40 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
