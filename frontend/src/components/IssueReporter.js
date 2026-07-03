import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const IssueReporter = () => {
  const { user, reportIssue } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!user || user.role === 'admin') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');

    if (!message.trim()) {
      setFeedback('Please enter issue details.');
      return;
    }

    setLoading(true);
    const result = await reportIssue(category, message.trim());
    setLoading(false);

    if (!result.success) {
      setFeedback(result.message);
      return;
    }

    setFeedback('Issue submitted to admin successfully.');
    setMessage('');
  };

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 90, zIndex: 1200 }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-dark rounded-pill shadow"
        >
          Report issue
        </button>
      ) : (
        <div className="card shadow" style={{ width: 320 }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Notify admin</h6>
              <button type="button" className="btn-close" onClick={() => setOpen(false)} aria-label="Close" />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label mb-1">Category</label>
                <select
                  className="form-select form-select-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="general">General</option>
                  <option value="case_assignment">Case assignment</option>
                  <option value="payment_issue">Payment issue</option>
                  <option value="technical">Technical support</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label mb-1">Message</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                />
              </div>
              {feedback && <div className="small mb-2 text-muted">{feedback}</div>}
              <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReporter;
