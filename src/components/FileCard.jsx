import { MoreVertical, FileText, File, Video } from 'lucide-react';
import './FileCard.css';

const getIcon = (type) => {
  switch (type) {
    case 'pdf': return FileText;
    case 'video': return Video;
    default: return File;
  }
};

export default function FileCard({ resources, onViewDoc }) {
  // Only display the first 3 resources on the Home Dashboard widget
  const displayedResources = resources.slice(0, 3);

  return (
    <div className="card file-card">
      <div className="card-header">
        <h3 className="card-title">
          <FileText size={18} className="title-icon" />
          Recent Resources
        </h3>
        <button className="icon-btn">
          <MoreVertical size={18} />
        </button>
      </div>
      
      <div className="file-list">
        {displayedResources.map((file) => {
          const FileIcon = getIcon(file.type);
          return (
            <div key={file.id} className="file-item" onClick={() => onViewDoc(file)}>
              <div className="file-icon-wrapper" style={{ color: file.color || '#3B82F6' }}>
                <FileIcon size={20} />
              </div>
              <span className="file-name">{file.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
