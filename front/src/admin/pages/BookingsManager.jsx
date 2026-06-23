import React, { useState, useEffect } from 'react';
import { Tabs, Button, Modal, Form, Input, Select, DatePicker, message, Card, Tag, Space, Badge } from 'antd';
import { CheckOutlined, CloseOutlined, PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { adminService } from '../../services';
import dayjs from 'dayjs';

const HORAS = Array.from({ length: 24 }, (_, i) => i);

function minutosRestantes(created_at) {
  const diff = 30 - dayjs().diff(dayjs(created_at), 'minute');
  return diff > 0 ? diff : 0;
}

function agruparPorDia(bookings) {
  const grupos = {};
  for (const b of bookings) {
    if (!grupos[b.date]) grupos[b.date] = [];
    grupos[b.date].push(b);
  }
  return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
}

export default function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBookings();
const arr = Array.isArray(data) ? data : (data.bookings || []);
const hoy = dayjs().format('YYYY-MM-DD');
const filtrados = arr.filter(b => b.date >= hoy);
setBookings(filtrados.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour));
    } catch { message.error('Error al cargar turnos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (id) => {
    try {
      await adminService.confirmBooking(id);
      message.success('Clase confirmada.');
      fetchBookings();
    } catch { message.error('Error al confirmar.'); }
  };

  const handleReject = async (id) => {
    try {
      await adminService.cancelBooking(id);
      message.success('Turno cancelado.');
      fetchBookings();
    } catch { message.error('Error al cancelar.'); }
  };

  const handleCreateManual = async (values) => {
    try {
      await adminService.createManualBooking({
        date: values.date.format('YYYY-MM-DD'),
        hour: Number(values.hour),
        student_name: values.student_name,
        student_lastname: values.student_lastname,
        subject: values.subject,
        level: values.level || '',
        institution: values.institution || '',
        extra_info: values.extra_info || '',
        contact: values.contact || 'Agendado manualmente',
      });
      message.success('¡Clase agendada!');
      setIsModalOpen(false);
      form.resetFields();
      fetchBookings();
    } catch { message.error('Error. Revisá si el horario ya está ocupado.'); }
  };

  const renderCard = (item) => {
    const isPending = item.status === 'pendiente' || item.status === 'pendiente_comprobante';
    const isConfirmed = item.status === 'confirmada';
    const isCancelled = item.status === 'cancelada';
    const mins = isPending ? minutosRestantes(item.created_at) : null;

    return (
      <Card
        key={item.id}
        size="small"
        style={{
          marginBottom: 10,
          borderRadius: 8,
          borderLeft: `4px solid ${isConfirmed ? '#52c41a' : isPending ? '#faad14' : '#ff4d4f'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <strong>{String(item.hour).padStart(2, '0')}:00 hs</strong>
            {item.created_at && (
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>
                Pedido: {dayjs(item.created_at).format('HH:mm')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isPending && mins > 0 && (
              <Tag icon={<ClockCircleOutlined />} color="warning">{mins} min</Tag>
            )}
            {isPending && mins === 0 && <Tag color="error">Expirado</Tag>}
            {isConfirmed && <Tag color="success">Confirmada</Tag>}
            {isCancelled && <Tag color="error">Cancelada</Tag>}
          </div>
        </div>

        <div style={{ fontSize: 13, marginBottom: 8 }}>
          <p style={{ margin: '2px 0' }}>👤 {item.student_name} {item.student_lastname}</p>
          <p style={{ margin: '2px 0' }}>📚 {item.subject}{item.level ? ` (${item.level})` : ''}</p>
          {item.institution && <p style={{ margin: '2px 0', color: '#8c8c8c' }}>🏢 {item.institution}</p>}
          {item.contact && <p style={{ margin: '2px 0', color: '#8c8c8c' }}>📱 {item.contact}</p>}
        </div>

        {!isCancelled && (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {isPending && (
              <>
                <Button size="small" type="primary" icon={<CheckOutlined />}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => handleConfirm(item.id)}>
                  Confirmar
                </Button>
                <Button size="small" type="primary" danger icon={<CloseOutlined />}
                  onClick={() => handleReject(item.id)}>
                  Rechazar
                </Button>
              </>
            )}
            {isConfirmed && (
              <Button size="small" type="text" danger icon={<CloseOutlined />}
                onClick={() => handleReject(item.id)}>
                Cancelar clase
              </Button>
            )}
          </Space>
        )}
      </Card>
    );
  };

  // Confirmadas agrupadas por día
  const confirmadas = bookings.filter(b => b.status === 'confirmada');
  const pendientes = bookings.filter(b => b.status === 'pendiente' || b.status === 'pendiente_comprobante');
  const grupos = agruparPorDia(confirmadas);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontFamily: 'Georgia, serif' }}>Gestión de Turnos</h3>
        <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} />
      </div>

      <Tabs defaultActiveKey="pendientes" size="small" items={[
        {
          key: 'pendientes',
          label: <Badge count={pendientes.length} offset={[8, 0]}>Pendientes</Badge>,
          children: loading ? <p>Cargando...</p> : pendientes.length === 0
            ? <p style={{ color: '#999' }}>No hay turnos pendientes.</p>
            : pendientes.map(renderCard)
        },
        {
          key: 'confirmadas',
          label: 'Confirmadas',
          children: loading ? <p>Cargando...</p> : grupos.length === 0
            ? <p style={{ color: '#999' }}>No hay clases confirmadas.</p>
            : grupos.map(([date, items]) => (
              <div key={date} style={{ marginBottom: 20 }}>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontWeight: 600,
                  fontSize: 15,
                  marginBottom: 8,
                  paddingBottom: 4,
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  {dayjs(date).format('dddd D [de] MMMM')}
                </div>
                {items.map(renderCard)}
              </div>
            ))
        },
        {
          key: 'todas',
          label: 'Todas',
          children: loading ? <p>Cargando...</p> : bookings.length === 0
            ? <p style={{ color: '#999' }}>No hay turnos.</p>
            : bookings.map(renderCard)
        }
      ]} />

      <Modal
        title="Agendar clase manual"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        destroyOnHidden={true}
        width={340}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateManual} size="small">
          <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="hour" label="Hora" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar">
              {HORAS.map(h => (
                <Select.Option key={h} value={h}>{`${String(h).padStart(2, '0')}:00 hs`}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="student_name" label="Nombre" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="student_lastname" label="Apellido" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="subject" label="Materia" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="level" label="Nivel"><Input /></Form.Item>
          <Form.Item name="institution" label="Colegio / Facultad"><Input /></Form.Item>
          <Form.Item name="contact" label="Teléfono de contacto"><Input /></Form.Item>
          <Form.Item name="extra_info" label="Notas adicionales"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}