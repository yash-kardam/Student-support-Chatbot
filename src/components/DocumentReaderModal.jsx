import { X, FileText, Download, Printer } from 'lucide-react';
import './DocumentReaderModal.css';

export default function DocumentReaderModal({ doc, onClose }) {
  const hasHtml = Boolean(doc.htmlContent);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card doc-reader-card glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="doc-reader-header">
          <div className="doc-title-section">
            <div className="doc-icon-wrapper" style={{ color: doc.color || '#3B82F6' }}>
              <FileText size={20} />
            </div>
            <h3 title={doc.name}>{doc.name}</h3>
          </div>

          <div className="doc-header-actions">
            <button className="icon-btn" title="Download Resource">
              <Download size={18} />
            </button>
            <button className="icon-btn" title="Print Resource" onClick={() => window.print()}>
              <Printer size={18} />
            </button>
            <button className="icon-btn close-btn" onClick={onClose} title="Close Reader">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="doc-reader-body">
          <div className="doc-page">
            {hasHtml ? (
              /* Rendered HTML from mammoth (docx) or iframe (pdf) */
              <div
                className="doc-html-content"
                dangerouslySetInnerHTML={{ __html: doc.htmlContent }}
              />
            ) : (
              /* Plain text fallback */
              <pre className="doc-text-content">{doc.content}</pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="doc-reader-footer">
          <span>{doc.size ? `${doc.size} • ` : ''}{doc.type?.toUpperCase()}</span>
          <button className="upgrade-btn read-finish-btn" onClick={onClose}>
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
}
