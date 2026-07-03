import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const CredentialManager = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingControls, setLoadingControls] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('muted');
  const [requestMeta, setRequestMeta] = useState(null);
  const [staffCode, setStaffCode] = useState('');
  const [generatedStaffId, setGeneratedStaffId] = useState('');
  const [controls, setControls] = useState(null);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    const loadControls = async () => {
      setLoadingControls(true);
      try {
        const response = await authAPI.me();
        const me = response.data?.data?.user || null;
        setCurrentUser(me || user);
        setControls(me?.credentialControls || null);
      } catch (error) {
        setCurrentUser(user);
        setControls(null);
      } finally {
        setLoadingControls(false);
      }
    };

    if (user) loadControls();
  }, [user]);

  const refreshControls = async () => {
    try {
      const response = await authAPI.me();
      const me = response.data?.data?.user || null;
      setCurrentUser(me || user);
      setControls(me?.credentialControls || null);
    } catch (error) {
      // Ignore refresh errors to avoid blocking UI actions
    }
  };

  if (!user) return null;

  const requestStaffIdCode = async () => {
    setLoading(true);
    setFeedback('');
    setFeedbackType('muted');
    try {
      const response = await authAPI.requestStaffId();
      setRequestMeta(response.data);
      setFeedback(response.data?.message || 'Staff ID code sent to your email.');
      setFeedbackType('success');
      await refreshControls();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to request Staff ID code');
      setFeedbackType('danger');
      await refreshControls();
    } finally {
      setLoading(false);
    }
  };

  const verifyStaffIdCode = async () => {
    if (!staffCode.trim()) {
      setFeedback('Enter the Staff ID verification code first.');
      setFeedbackType('danger');
      return;
    }

    setLoading(true);
    setFeedback('');
    setFeedbackType('muted');
    try {
      const response = await authAPI.verifyStaffId(staffCode.trim(), currentUser?.state || user.state, currentUser?.lga || user.lga);
      setGeneratedStaffId(response.data?.data?.staffId || 'Pending approval');
      setFeedback(response.data?.message || 'Staff ID generated successfully.');
      setFeedbackType('success');
      await refreshControls();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to verify Staff ID code');
      setFeedbackType('danger');
      await refreshControls();
    } finally {
      setLoading(false);
    }
  };

  const hasFinalStaffId = Boolean(currentUser?.staffId || user.staffId);
  const selfWindowExpired = Boolean(controls?.selfService?.windowExpired);
  const canGenerateStaffId = controls ? Boolean(controls?.selfService?.staffId?.canGenerate) : true;
  const selfStaffRemaining = controls?.selfService?.staffId?.remaining ?? 0;

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 160, zIndex: 1200 }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-outline-dark rounded-pill shadow"
        >
          Credentials
        </button>
      ) : (
        <div className="card shadow" style={{ width: 360 }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Staff Credentials</h6>
              <button type="button" className="btn-close" onClick={() => setOpen(false)} aria-label="Close" />
            </div>

            {loadingControls && (
              <div className="small mb-2 text-muted">Loading credential status...</div>
            )}

            <div className="small mb-2 text-muted">
              Write down your Staff ID somewhere safe. Recovery codes are now issued only by an administrator.
            </div>

            {hasFinalStaffId ? (
              <div className="small mb-2 text-success">Your Staff ID is already approved: {currentUser?.staffId || user.staffId}</div>
            ) : !selfWindowExpired ? (
              <>
                <button type="button" className="btn btn-sm btn-primary mb-2 me-2" onClick={requestStaffIdCode} disabled={loading || selfWindowExpired || !canGenerateStaffId}>
                  Request Staff ID Code
                </button>
                <div className="mb-2">
                  <label className="form-label mb-1">Enter Staff ID Code</label>
                  <input
                    className="form-control form-control-sm"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    disabled={loading}
                    placeholder="Code sent to your email"
                  />
                </div>
                <button type="button" className="btn btn-sm btn-success mb-2" onClick={verifyStaffIdCode} disabled={loading || selfWindowExpired || !canGenerateStaffId}>
                  Generate Staff ID
                </button>
                <div className="small text-muted mb-2">Staff ID self-generation remaining: {selfStaffRemaining}</div>
              </>
            ) : (
              <div className="small mb-2 text-danger">Staff ID self-generation option has expired. Contact admin for regeneration support.</div>
            )}

            <div className="mt-2 pt-2 border-top">
              <div className="small text-muted">Recovery codes are stored in your account record when an administrator generates or regenerates them for you.</div>
            </div>

            {selfWindowExpired && (
              <div className="small mt-2 text-danger">
                Self-service has expired after 24 hours. Only admin can regenerate credentials (up to 5 times).
              </div>
            )}

            {requestMeta?.demoCode && (
              <div className="small text-muted mt-2">Demo code: {requestMeta.demoCode}</div>
            )}
            {generatedStaffId && (
              <div className="small text-muted mt-2">Generated Staff ID: {generatedStaffId}</div>
            )}
            {feedback && (
              <div className={`small mt-2 text-${feedbackType}`}>{feedback}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialManager;
