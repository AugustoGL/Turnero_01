import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/login', { password: values.password }, { withCredentials: true });
      if (res.data.ok) {
        message.success('¡Bienvenida Profe Nati!');
        onLoginSuccess();
        navigate('/admin/bookings');
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Contraseña incorrecta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#fffbe6',
        padding: 16,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ fontFamily: 'Georgia, serif', margin: 0 }}>
            Panel Admin
          </Title>
          <Typography.Text type="secondary">Profe Nati</Typography.Text>
        </div>
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Ingresa la contraseña' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Contraseña de acceso"
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ fontWeight: 'bold' }}
            >
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
