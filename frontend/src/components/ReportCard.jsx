import React from 'react';

export default function ReportCard({ report, type, onView, onEdit, onDelete }) {
  const imageUrl = report.image ? (report.image.startsWith('/') ? `http://localhost:5000${report.image}` : report.image) : null;
  const dateField = type === 'lost' ? report.dateLost : report.dateFound;
  const formattedDate = new Date(dateField).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-xl overflow-hidden hover:border-white/20 transition-colors group flex flex-col">
      <div className="h-48 bg-[#111111] relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={report.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            No Image
          </div>
        )}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white border border-white/10">
          {report.status}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-white line-clamp-1" title={report.title}>{report.title}</h3>
          <span className="text-xs font-medium text-zinc-400 bg-white/5 px-2 py-1 rounded">{report.category}</span>
        </div>
        
        <p className="text-sm text-zinc-500 mb-4 flex-1 line-clamp-2" title={report.description}>
          {report.description}
        </p>

        <div className="text-xs text-zinc-400 mb-4">
          <p>📍 {type === 'lost' ? report.locationLost : report.locationFound}</p>
          <p className="mt-1">🗓️ {formattedDate}</p>
        </div>

        <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
          <button 
            onClick={() => onView(report)}
            className="flex-1 text-xs font-medium text-white bg-white/5 hover:bg-white/10 py-2 rounded-lg transition-colors border border-white/5"
          >
            View
          </button>
          <button 
            onClick={() => onEdit(report)}
            className="flex-1 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-lg transition-colors border border-blue-500/10"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(report._id)}
            className="flex-1 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2 rounded-lg transition-colors border border-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
