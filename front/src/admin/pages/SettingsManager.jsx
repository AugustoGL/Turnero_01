import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, InputNumber, Divider } from 'antd';
import { SaveOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services';

export default function SettingsManager({ onLogout }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    adminService.getSettings()
      .then(data => {
        form.setFieldsValue({
          business_name: data.business_name,
          default_price: Number(data.default_price),
          default_deposit_amount: Number(data.default_deposit_amount || 0),
          mom_whatsapp: data.mom_whatsapp
        });
      })
      .catch(() => message.error('No se pudieron cargar las configuraciones.'));
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await adminService.updateSettings({
        business_name: values.business_name,
        default_price: Number(values.default_price),
        default_deposit_amount: Number(values.default_deposit_amount),
        mom_whatsapp: values.mom_whatsapp
      });
      message.success('¡Configuración guardada!');
    } catch (err) {
      message.error('Error al actualizar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await adminService.logout();
      message.info('Sesión cerrada correctamente');
      onLogout?.();
      navigate('/admin/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3 style={{ fontFamily: 'Georgia, serif', marginBottom: 16, marginTop: 4 }}>Configuración</h3>

      <Card size="large" title="Parámetros del Sistema">
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="business_name" label="Nombre del Negocio" rules={[{ required: true, message: 'Falta nombre' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="default_price" label="Precio de la clase ($)" rules={[{ required: true, message: 'Falta precio' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="default_deposit_amount" label="Monto de la seña ($)" rules={[{ required: true, message: 'Falta el monto' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="mom_whatsapp" label="WhatsApp (formato internacional, sin +)">
            <Input placeholder="Ej: 5493512345678" />
          </Form.Item>

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block loading={loading} style={{ fontWeight: 'bold', marginTop: 8 }}>
            Guardar Cambios
          </Button>
        </Form>

        <Divider style={{ margin: '16px 0' }} />

        <Button type="default" danger block icon={<LogoutOutlined />} onClick={handleLogoutClick} style={{ fontWeight: 'bold' }}>
          Cerrar Sesión Admin
        </Button>
      </Card>
    </div>
  );
}