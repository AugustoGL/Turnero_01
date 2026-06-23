
import { ConfigProvider, Layout, Form, Input, Button, Card, Typography, message, theme } from 'antd';
import { LockOutlined, CalendarOutlined, SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayoutContent({ isAdmin, children }) {

  const { Content } = Layout;
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const currentTab = location.pathname.split('/').pop() || 'bookings';

  const menuItems = [
    { key: 'bookings', icon: <CalendarOutlined />, label: 'Turnos' },
    { key: 'fixed', icon: <ClockCircleOutlined />, label: 'Horarios' }, // Unificado
    { key: 'settings', icon: <SettingOutlined />, label: 'Config' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', paddingBottom: 65, }}>
      {/* Content sin Header superior */}
      <Content style={{ padding: '16px 12px 0', overflow: 'initial', }}>
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '16px',
            minHeight: 'calc(100vh - 90px)',
            backgroundColor: token.colorBg,

            border: '1px solid token.colorBorder',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >          {children}
        </div>
      </Content>

      {/* 📱 MENU INFERIOR MOBILE */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 65,
        backgroundColor: token.colorBgElevated,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {menuItems.map(item => {
          const isActive = currentTab === item.key;
          return (
            <div
              key={item.key}
              onClick={() => navigate(`/admin/${item.key}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? token.colorPrimaryActive : token.colorPrimary,
                cursor: 'pointer',
                fontSize: 11,
                flex: 1,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</div>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
