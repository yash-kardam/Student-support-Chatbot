import { useState } from 'react';
import mammoth from 'mammoth';
import { Search, FileText, Upload, Plus, Download, Eye, FileUp } from 'lucide-react';
import './ResourcesPage.css';

const TABS = ['All', 'Documents', 'Reports', 'Video', 'Audio'];

export default function ResourcesPage({ resources, setResources, onViewDoc }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isUploading, setIsUploading] = useState(false);

  // Handle local file upload — parses docx via mammoth, text files directly
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset the input so the same file can be re-uploaded if needed
    e.target.value = '';

    const ext = file.name.split('.').pop().toLowerCase();
    setIsUploading(true);

    try {
      let content = '';
      let htmlContent = null;
      let fileType = 'doc';
      let iconColor = '#3B82F6';

      if (['docx', 'doc'].includes(ext)) {
        // ── Real .docx parsing via mammoth ──────────────────────────────
        fileType = 'doc';
        iconColor = '#2563EB';
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        htmlContent = result.value;                          // rich HTML
        content = (await mammoth.extractRawText({ arrayBuffer })).value; // plain text for RAG
        if (result.messages?.length) {
          console.info('Mammoth messages:', result.messages);
        }

      } else if (ext === 'pdf') {
        // ── PDF: browser can display natively ───────────────────────────
        fileType = 'pdf';
        iconColor = '#EF4444';
        const url = URL.createObjectURL(file);
        htmlContent = `<iframe src="${url}" style="width:100%;height:70vh;border:none;border-radius:8px;" title="${file.name}"></iframe>`;
        content = `[PDF file: ${file.name}] — Preview shown in viewer above.`;

      } else if (file.type.startsWith('text/') || ['txt', 'md', 'csv', 'json', 'js', 'ts', 'py', 'html', 'css'].includes(ext)) {
        // ── Plain text / code / markdown ─────────────────────────────────
        fileType = ext === 'md' ? 'md' : ext === 'csv' ? 'csv' : 'doc';
        iconColor = '#0284C7';
        content = await file.text();

      } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
        fileType = 'video';
        iconColor = '#F59E0B';
        content = `[Video file: ${file.name}]`;

      } else {
        // unknown binary
        content = `[File: ${file.name}]\n\nThis file type cannot be previewed in the browser. You can still use it as context for the AI.`;
      }

      const newResource = {
        id: Date.now(),
        name: file.name,
        type: fileType,
        color: iconColor,
        content,
        htmlContent: htmlContent || null,
        size: file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`,
      };

      setResources([newResource, ...resources]);
    } catch (err) {
      console.error('File parse error:', err);
      alert(`Could not parse "${file.name}": ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter items
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'Documents') {
      matchesTab = res.type === 'doc' || res.type === 'pdf';
    } else if (activeTab === 'Video') {
      matchesTab = res.type === 'video';
    } else if (activeTab === 'Reports') {
      matchesTab = res.name.toLowerCase().includes('report') || res.name.toLowerCase().includes('syllabus');
    } else if (activeTab === 'Audio') {
      matchesTab = res.type === 'audio';
    }
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="resources-page">
      <header className="page-header">
        <h1 className="page-title">Saved Resources</h1>
        <p className="page-subtitle">Access your textbook summaries, wellbeing guides, and upload study materials.</p>
      </header>

      {/* Upload & Search Row */}
      <div className="resources-action-row">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search guides or uploads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dynamic Upload Module */}
        <label className={`upload-btn-label ${isUploading ? 'uploading' : ''}`}>
          {isUploading ? (
            <><span className="upload-spinner" /> Parsing…</>
          ) : (
            <><FileUp size={16} /> Upload File</>
          )}
          <input
            type="file"
            className="hidden-file-input"
            onChange={handleFileUpload}
            accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.js,.ts,.py,.html,.css"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="resources-tabs">
        {TABS.map((tab) => (
          <button 
            key={tab} 
            className={`resource-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid of Files */}
      <div className="resources-grid">
        {filteredResources.length === 0 ? (
          <div className="empty-resources card">
            <Eye size={48} className="empty-icon" />
            <h3>No resources found</h3>
            <p>Upload a txt/pdf file above to add it to your dashboard.</p>
          </div>
        ) : (
          filteredResources.map((res) => (
            <div key={res.id} className="card resource-card" onClick={() => onViewDoc(res)}>
              <div className="resource-icon-section" style={{ color: res.color || '#3B82F6' }}>
                <FileText size={40} />
              </div>
              
              <div className="resource-info">
                <h4 className="resource-name">{res.name}</h4>
                <span className="resource-meta">{res.size || '94 KB'} • {res.type.toUpperCase()}</span>
              </div>
              
              <div className="resource-actions">
                <button className="resource-action-btn" title="View Guide">
                  <Eye size={16} />
                </button>
                <button className="resource-action-btn" title="Download">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
