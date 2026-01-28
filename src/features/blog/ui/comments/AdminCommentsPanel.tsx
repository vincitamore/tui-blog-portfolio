/**
 * Admin Comments Panel
 * Shows comment metrics, recent comments with moderation actions, and IP ban management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminComments,
  deleteComment,
  banIp,
  unbanIp,
  fetchBannedIps,
  AdminComment,
  AdminCommentsResponse,
  BanEntry,
} from '../../../../shared/lib/api';
import './AdminCommentsPanel.css';

interface AdminCommentsPanelProps {
  onNavigateToPost?: (slug: string) => void;
}

export const AdminCommentsPanel: React.FC<AdminCommentsPanelProps> = ({ onNavigateToPost }) => {
  const [data, setData] = useState<AdminCommentsResponse | null>(null);
  const [bannedIps, setBannedIps] = useState<BanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'comments' | 'bans'>('comments');
  const [banReason, setBanReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [commentsData, bansData] = await Promise.all([
        fetchAdminComments(),
        fetchBannedIps(),
      ]);
      setData(commentsData);
      setBannedIps(bansData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (comment: AdminComment) => {
    if (!confirm(`Delete comment by "${comment.author}"?`)) return;

    setActionInProgress(comment.id);
    try {
      await deleteComment(comment.postSlug, comment.id);
      // Remove from local state
      setData(prev => prev ? {
        ...prev,
        totalComments: prev.totalComments - 1,
        comments: prev.comments.filter(c => c.id !== comment.id),
      } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBan = async (ip: string) => {
    if (!confirm(`Ban IP address ${ip}?`)) return;

    setActionInProgress(ip);
    try {
      const entry = await banIp(ip, banReason || 'Banned from admin panel');
      setBannedIps(prev => [...prev, entry]);
      setBanReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to ban IP');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnban = async (ip: string) => {
    if (!confirm(`Unban IP address ${ip}?`)) return;

    setActionInProgress(ip);
    try {
      await unbanIp(ip);
      setBannedIps(prev => prev.filter(b => b.ip !== ip));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unban IP');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLen = 150) => {
    if (content.length <= maxLen) return content;
    return content.substring(0, maxLen).trim() + '...';
  };

  if (loading) {
    return (
      <div className="admin-comments-panel">
        <div className="admin-loading">Loading admin data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-comments-panel">
        <div className="admin-error">{error}</div>
        <button className="admin-btn" onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-comments-panel">
      <div className="admin-header">
        <h2>Comment Moderation</h2>
        <button className="admin-btn admin-btn-small" onClick={loadData}>
          Refresh
        </button>
      </div>

      {/* Metrics Dashboard */}
      <div className="admin-metrics">
        <div className="metric">
          <span className="metric-value">{data?.totalComments || 0}</span>
          <span className="metric-label">Total Comments</span>
        </div>
        <div className="metric metric-highlight">
          <span className="metric-value">{data?.newSinceLastLogin || 0}</span>
          <span className="metric-label">New Since Login</span>
        </div>
        <div className="metric">
          <span className="metric-value">{Object.keys(data?.commentsByPost || {}).length}</span>
          <span className="metric-label">Posts with Comments</span>
        </div>
        <div className="metric">
          <span className="metric-value">{bannedIps.length}</span>
          <span className="metric-label">Banned IPs</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${selectedTab === 'comments' ? 'active' : ''}`}
          onClick={() => setSelectedTab('comments')}
        >
          Comments ({data?.comments.length || 0})
        </button>
        <button
          className={`admin-tab ${selectedTab === 'bans' ? 'active' : ''}`}
          onClick={() => setSelectedTab('bans')}
        >
          Banned IPs ({bannedIps.length})
        </button>
      </div>

      {/* Comments Tab */}
      {selectedTab === 'comments' && (
        <div className="admin-comments-list">
          {data?.comments.length === 0 ? (
            <div className="admin-empty">No comments yet</div>
          ) : (
            data?.comments.map(comment => {
              const isBanned = bannedIps.some(b => b.ip === comment.ip);
              const isNew = new Date(comment.createdAt).getTime() > new Date(data.lastLogin).getTime();

              return (
                <div
                  key={comment.id}
                  className={`admin-comment ${isNew ? 'admin-comment-new' : ''}`}
                >
                  <div className="admin-comment-header">
                    <span className="admin-comment-author">
                      {comment.author}
                      {isNew && <span className="admin-badge admin-badge-new">NEW</span>}
                    </span>
                    <span className="admin-comment-meta">
                      on{' '}
                      <button
                        className="admin-link"
                        onClick={() => onNavigateToPost?.(comment.postSlug)}
                      >
                        {comment.postSlug}
                      </button>
                      {' · '}
                      {formatDate(comment.createdAt)}
                      {comment.edited && <span className="admin-edited"> (edited)</span>}
                    </span>
                  </div>

                  <div className="admin-comment-content">
                    {truncateContent(comment.content)}
                  </div>

                  <div className="admin-comment-footer">
                    <span className={`admin-ip ${isBanned ? 'admin-ip-banned' : ''}`}>
                      IP: {comment.ip}
                      {isBanned && <span className="admin-badge admin-badge-banned">BANNED</span>}
                    </span>

                    <div className="admin-comment-actions">
                      {!isBanned && (
                        <button
                          className="admin-btn admin-btn-warn"
                          onClick={() => handleBan(comment.ip)}
                          disabled={actionInProgress === comment.ip}
                        >
                          Ban IP
                        </button>
                      )}
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => handleDelete(comment)}
                        disabled={actionInProgress === comment.id}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bans Tab */}
      {selectedTab === 'bans' && (
        <div className="admin-bans">
          <div className="admin-ban-form">
            <input
              type="text"
              placeholder="Ban reason (optional)"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              className="admin-input"
            />
          </div>

          {bannedIps.length === 0 ? (
            <div className="admin-empty">No banned IPs</div>
          ) : (
            <div className="admin-bans-list">
              {bannedIps.map(ban => (
                <div key={ban.ip} className="admin-ban-entry">
                  <div className="admin-ban-info">
                    <span className="admin-ban-ip">{ban.ip}</span>
                    <span className="admin-ban-reason">{ban.reason}</span>
                    <span className="admin-ban-date">
                      Banned {formatDate(ban.bannedAt)}
                    </span>
                  </div>
                  <button
                    className="admin-btn admin-btn-small"
                    onClick={() => handleUnban(ban.ip)}
                    disabled={actionInProgress === ban.ip}
                  >
                    Unban
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
