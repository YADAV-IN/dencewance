import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiGet, getApiErrorMessage } from '../utils/apiClient';

const PALETTE = ['#89f7fe', '#66a6ff', '#7c3aed', '#f59e0b', '#22c55e', '#f97316'];

const formatBytes = (bytes = 0) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const toArray = (value) => (Array.isArray(value) ? value : []);

export default function CRMDashboard({ adminData, isDesktop }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [usage, setUsage] = useState(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedContent, setSelectedContent] = useState({ reels: [], posts: [], totalReels: 0, totalPosts: 0 });
  const [reportBusy, setReportBusy] = useState(false);

  const selectedAdmin = useMemo(
    () => admins.find((item) => String(item.id || item._id) === String(selectedAdminId)) || null,
    [admins, selectedAdminId],
  );

  const roleBreakdown = useMemo(() => {
    const counts = admins.reduce((accumulator, admin) => {
      const role = admin.role || 'member';
      accumulator[role] = (accumulator[role] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: PALETTE[index % PALETTE.length] }));
  }, [admins]);

  const monthlyTrend = useMemo(() => {
    const months = admins.reduce((accumulator, admin) => {
      const created = admin.created_at || admin.createdAt || admin.created;
      if (!created) return accumulator;
      const date = new Date(created);
      if (Number.isNaN(date.getTime())) return accumulator;
      const key = date.toLocaleString('en-US', { month: 'short' });
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [admins]);

  const storageSeries = useMemo(() => {
    const appwrite = usage?.appwrite || {};
    const r2 = usage?.r2 || {};
    return [
      { name: 'Appwrite', files: Number(appwrite.totalFiles) || 0, bytes: Number(appwrite.totalBytes) || 0 },
      { name: 'R2', files: Number(r2.totalFiles) || 0, bytes: Number(r2.totalBytes) || 0 },
    ];
  }, [usage]);

  const summaryCards = useMemo(() => {
    const totalPosts = Number(selectedContent.totalPosts) || toArray(selectedContent.posts).length;
    const totalReels = Number(selectedContent.totalReels) || toArray(selectedContent.reels).length;
    const dbCounts = usage?.dbCounts || {};

    return [
      { label: 'Admins', value: admins.length, hint: 'Total accounts' },
      { label: 'Active Admins', value: admins.filter((item) => (item.status || 'active') === 'active').length, hint: 'Working now' },
      { label: 'Selected User Content', value: totalPosts + totalReels, hint: 'Posts + reels' },
      { label: 'Library Items', value: Object.values(dbCounts).reduce((sum, item) => sum + (Number(item) || 0), 0), hint: 'Stored records' },
    ];
  }, [admins, selectedContent, usage]);

  const loadDashboard = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const [profileResponse, adminsResponse, usageResponse] = await Promise.all([
        apiGet('/api/profile'),
        apiGet('/api/admins'),
        apiGet('/api/storage/usage'),
      ]);

      const profileData = profileResponse?.data || profileResponse;
      const adminsData = Array.isArray(adminsResponse?.data) ? adminsResponse.data : Array.isArray(adminsResponse) ? adminsResponse : [];
      const usageData = usageResponse?.data || usageResponse;

      setProfile(profileData || null);
      setAdmins(adminsData);
      setUsage(usageData || null);

      const preferredId = String(selectedAdminId || adminData?._id || adminData?.id || profileData?.id || profileData?._id || adminsData[0]?.id || adminsData[0]?._id || '');
      if (preferredId && !selectedAdminId) {
        setSelectedAdminId(preferredId);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'CRM data could not be loaded.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const targetId = selectedAdminId || selectedAdmin?._id || selectedAdmin?.id;
    if (!targetId) return;

    let cancelled = false;

    const loadContent = async () => {
      try {
        const response = await apiGet(`/api/users/${targetId}/content`);
        if (cancelled) return;

        const payload = response?.data || response || {};
        setSelectedContent({
          reels: toArray(payload.reels),
          posts: toArray(payload.posts),
          totalReels: Number(payload.totalReels) || toArray(payload.reels).length,
          totalPosts: Number(payload.totalPosts) || toArray(payload.posts).length,
        });
      } catch (requestError) {
        if (!cancelled) {
          setSelectedContent({ reels: [], posts: [], totalReels: 0, totalPosts: 0 });
        }
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [selectedAdminId, selectedAdmin]);

  const exportPdf = async () => {
    setReportBusy(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const currentAdmin = profile || adminData || {};

      doc.setFillColor(7, 10, 24);
      doc.rect(0, 0, 297, 210, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('DenceWance CRM Report', 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
      doc.text(`Operator: ${currentAdmin?.name || currentAdmin?.email || 'Admin'}`, 14, 32);

      autoTable(doc, {
        startY: 40,
        head: [['Metric', 'Value', 'Note']],
        body: summaryCards.map((card) => [card.label, String(card.value), card.hint]),
        theme: 'grid',
        styles: { fillColor: [10, 15, 35], textColor: 245, lineColor: [60, 70, 90] },
        headStyles: { fillColor: [18, 24, 48], textColor: 255 },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Admin', 'Role', 'Status', 'Joined']],
        body: admins.slice(0, 12).map((item) => [
          item.name || 'Unnamed',
          item.role || 'member',
          item.status || 'active',
          formatDate(item.created_at || item.createdAt || item.created),
        ]),
        theme: 'grid',
        styles: { fillColor: [10, 15, 35], textColor: 245, lineColor: [60, 70, 90] },
        headStyles: { fillColor: [18, 24, 48], textColor: 255 },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Selected Content', 'Type', 'Published']],
        body: [
          ...toArray(selectedContent.reels).slice(0, 6).map((item) => [item.title || 'Untitled reel', 'Reel', formatDate(item.published_at || item.created_at || item.createdAt)]),
          ...toArray(selectedContent.posts).slice(0, 6).map((item) => [item.title || 'Untitled post', 'Post', formatDate(item.published_at || item.created_at || item.createdAt)]),
        ],
        theme: 'grid',
        styles: { fillColor: [10, 15, 35], textColor: 245, lineColor: [60, 70, 90] },
        headStyles: { fillColor: [18, 24, 48], textColor: 255 },
      });

      doc.save(`dencewance-crm-${Date.now()}.pdf`);
    } finally {
      setReportBusy(false);
    }
  };

  if (!isDesktop) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top, #11213c 0%, #050816 55%, #03040a 100%)', color: '#fff', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 520, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, background: 'rgba(8,12,24,0.82)', boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}>
          <div style={{ fontSize: 14, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#8fb8ff', marginBottom: 12 }}>Desktop Only</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 30 }}>CRM dashboard opens on a larger screen.</h2>
          <p style={{ margin: 0, color: '#c7d2fe', lineHeight: 1.65 }}>This admin console is built for analytics, tables, and PDF reports, so it stays locked to desktop devices.</p>
        </div>
      </div>
    );
  }

  return (
    <section style={{ padding: '22px', color: '#fff', minHeight: '100%', background: 'radial-gradient(circle at top left, rgba(34,211,238,0.10), transparent 28%), radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 24%), linear-gradient(180deg, #060816 0%, #050816 50%, #03040a 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>Connected CRM</div>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Control room for admins, usage, and reports.</h1>
          <p style={{ margin: '10px 0 0', color: '#cbd5e1', maxWidth: 780, lineHeight: 1.6 }}>Live data from admins, profile, storage usage, and selected content. Export the current view as a PDF report when needed.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => loadDashboard({ silent: true })} style={{ border: '1px solid rgba(125,211,252,0.35)', background: 'rgba(8,15,28,0.9)', color: '#fff', padding: '12px 16px', borderRadius: 14, cursor: 'pointer' }}>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button onClick={exportPdf} disabled={reportBusy} style={{ border: 'none', background: 'linear-gradient(135deg, #fbbf24, #fb7185)', color: '#09111f', padding: '12px 16px', borderRadius: 14, cursor: 'pointer', fontWeight: 700 }}>
            {reportBusy ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 18, border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(127,29,29,0.35)', color: '#fecaca', borderRadius: 16, padding: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#cbd5e1' }}>Loading CRM data...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 18 }}>
            {summaryCards.map((card) => (
              <article key={card.label} style={{ borderRadius: 22, padding: 18, background: 'linear-gradient(180deg, rgba(11,15,32,0.98), rgba(8,11,24,0.92))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.28)' }}>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>{card.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>{card.value}</div>
                <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 8 }}>{card.hint}</div>
              </article>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
            <section style={{ borderRadius: 24, padding: 18, background: 'rgba(8,12,24,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Admin growth</h2>
              <p style={{ margin: '6px 0 14px', color: '#94a3b8' }}>Monthly account creation trend</p>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={monthlyTrend.length ? monthlyTrend : [{ month: 'None', count: 0 }]}>
                    <defs>
                      <linearGradient id="crmTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#38bdf8" fill="url(#crmTrend)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ borderRadius: 24, padding: 18, background: 'rgba(8,12,24,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Role split</h2>
              <p style={{ margin: '6px 0 14px', color: '#94a3b8' }}>Current admin distribution</p>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={roleBreakdown.length ? roleBreakdown : [{ name: 'none', value: 1, fill: '#475569' }]} dataKey="value" nameKey="name" innerRadius={54} outerRadius={96} paddingAngle={4}>
                      {(roleBreakdown.length ? roleBreakdown : [{ fill: '#475569' }]).map((entry, index) => (
                        <Cell key={`role-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, marginBottom: 18 }}>
            <section style={{ borderRadius: 24, padding: 18, background: 'rgba(8,12,24,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Storage usage</h2>
                  <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>Appwrite and R2 volume snapshot</p>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 13 }}>
                  Appwrite: {formatBytes(usage?.appwrite?.totalBytes || 0)} · R2: {formatBytes(usage?.r2?.totalBytes || 0)}
                </div>
              </div>
              <div style={{ width: '100%', height: 280, marginTop: 10 }}>
                <ResponsiveContainer>
                  <BarChart data={storageSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip formatter={(value, key) => [key === 'bytes' ? formatBytes(value) : value, key]} />
                    <Legend />
                    <Bar dataKey="files" fill="#38bdf8" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="bytes" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ borderRadius: 24, padding: 18, background: 'rgba(8,12,24,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Selected admin</h2>
              <p style={{ margin: '6px 0 14px', color: '#94a3b8' }}>Drill down into usage and content</p>
              <select value={selectedAdminId} onChange={(event) => setSelectedAdminId(event.target.value)} style={{ width: '100%', borderRadius: 14, background: '#0f172a', color: '#fff', border: '1px solid rgba(148,163,184,0.2)', padding: '12px 14px', marginBottom: 14 }}>
                {admins.map((item) => (
                  <option key={item.id || item._id} value={item.id || item._id}>
                    {item.name || item.email || 'Unnamed'} · {item.role || 'member'}
                  </option>
                ))}
              </select>

              <div style={{ borderRadius: 18, padding: 16, background: 'linear-gradient(180deg, rgba(16,24,40,0.96), rgba(8,12,24,0.92))', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 14, color: '#94a3b8' }}>Name</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{selectedAdmin?.name || profile?.name || 'Admin'}</div>
                <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{selectedAdmin?.bio || profile?.bio || 'No bio available.'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 16 }}>
                  <div style={{ padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.7)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Status</div>
                    <div style={{ marginTop: 4, fontWeight: 700 }}>{selectedAdmin?.status || 'active'}</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.7)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Joined</div>
                    <div style={{ marginTop: 4, fontWeight: 700 }}>{formatDate(selectedAdmin?.created_at || selectedAdmin?.createdAt || selectedAdmin?.created)}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <section style={{ borderRadius: 24, padding: 18, background: 'rgba(8,12,24,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Users</h2>
              <p style={{ margin: '6px 0 14px', color: '#94a3b8' }}>Manage current admins and operators</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#93c5fd' }}>
                      <th style={{ padding: '10px 8px' }}>Name</th>
                      <th style={{ padding: '10px 8px' }}>Role</th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                      <th style={{ padding: '10px 8px' }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((item) => (
                      <tr key={item.id || item._id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }} onClick={() => setSelectedAdminId(String(item.id || item._id))}>
                        <td style={{ padding: '12px 8px' }}>{item.name || item.email || 'Unnamed'}</td>
                        <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>{item.role || 'member'}</td>
                        <td style={{ padding: '12px 8px' }}>{item.status || 'active'}</td>
                        <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>{formatDate(item.created_at || item.createdAt || item.created)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ borderRadius: 24, padding: 18, background: 'rgba(8,12,24,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Selected content</h2>
              <p style={{ margin: '6px 0 14px', color: '#94a3b8' }}>Recent posts and reels from the selected admin</p>
              <div style={{ display: 'grid', gap: 10, maxHeight: 370, overflow: 'auto', paddingRight: 4 }}>
                {[...toArray(selectedContent.reels).map((item) => ({ ...item, kind: 'Reel' })), ...toArray(selectedContent.posts).map((item) => ({ ...item, kind: 'Post' }))].slice(0, 10).map((item, index) => (
                  <article key={`${item.kind}-${item.id || item._id || index}`} style={{ borderRadius: 16, padding: 14, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <strong>{item.title || item.caption || 'Untitled item'}</strong>
                      <span style={{ color: '#38bdf8', fontSize: 12 }}>{item.kind}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{item.excerpt || item.caption || item.content || 'No description available.'}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>{formatDate(item.published_at || item.created_at || item.createdAt)}</div>
                  </article>
                ))}
                {!selectedContent.reels.length && !selectedContent.posts.length && (
                  <div style={{ color: '#94a3b8', padding: 18, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>No content found for this admin.</div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}