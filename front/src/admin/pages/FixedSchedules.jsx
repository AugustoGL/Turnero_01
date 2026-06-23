import React, { useState, useEffect } from 'react';
import { Form, Button, Select, Input, Card, Space, message, Popconfirm, Tabs, DatePicker, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { adminService } from '../../services';
import dayjs from 'dayjs';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HORAS = Array.from({ length: 24 }, (_, i) => i);

function agruparBloques(blocks) {
  const sorted = [...blocks].sort((a, b) => a.day_of_week - b.day_of_week || a.hour - b.hour);
  const grupos = [];
  for (const b of sorted) {
    const last = grupos[grupos.length - 1];
    if (last && last.day_of_week === b.day_of_week && last.label === b.label && last.hour_end === b.hour) {
      last.hour_end = b.hour + 1;
      last.ids.push(b.id);
    } else {
      grupos.push({ day_of_week: b.day_of_week, hour_start: b.hour, hour_end: b.hour + 1, label: b.label, ids: [b.id] });
    }
  }
  return grupos;
}

// ── TAB 1: HORARIOS FIJOS SEMANALES ──────────────────────────────────────────
function SemanalesTab() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllBlocks();
      setBlocks(res?.weekly || res?.weekly_blocks || []);
    } catch { message.error('Error al cargar horarios fijos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBlocks(); }, []);

  const onFinish = async (values) => {
    const start = Number(values.hour_start);
    const end = Number(values.hour_end);
    if (end <= start) return message.error('La hora de fin debe ser mayor a la de inicio.');
    try {
      await adminService.addWeeklyBlock({
        day_of_week: Number(values.day_of_week),
        hour_start: start,
        hour_end: end,
        label: values.label || 'Bloqueado'
      });
      message.success('Horario fijo bloqueado.');
      form.resetFields();
      fetchBlocks();
    } catch { message.error('Error al guardar.'); }
  };

  const handleDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => adminService.deleteWeeklyBlock(id)));
      message.success('Eliminado.');
      fetchBlocks();
    } catch { message.error('Error al eliminar.'); }
  };

  const grupos = agruparBloques(blocks);

  return (
    <div>
      <Card title="Bloquear rango semanal" size="small" style={{ marginBottom: 20 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="day_of_week" label="Día de la semana" rules={[{ required: true, message: 'Seleccioná un día' }]}>
            <Select placeholder="Seleccionar día">
              {DIAS.map((d, i) => <Select.Option key={i} value={i}>{d}</Select.Option>)}
            </Select>
          </Form.Item>
          <Space style={{ display: 'flex', width: '100%' }} align="baseline">
            <Form.Item name="hour_start" label="Desde" rules={[{ required: true, message: 'Requerido' }]} style={{ flex: 1 }}>
              <Select placeholder="Inicio">
                {HORAS.map(h => <Select.Option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="hour_end" label="Hasta" rules={[{ required: true, message: 'Requerido' }]} style={{ flex: 1 }}>
              <Select placeholder="Fin">
                {HORAS.map(h => <Select.Option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</Select.Option>)}
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="label" label="Etiqueta / Motivo">
            <Input placeholder="Ej: Colegio, Trabajo..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
            Bloquear rango
          </Button>
        </Form>
      </Card>

      <h4 style={{ marginBottom: 10 }}>Horarios bloqueados ({grupos.length})</h4>
      {loading && <p>Cargando...</p>}
      {!loading && grupos.length === 0 && <p style={{ color: '#999' }}>No hay horarios fijos bloqueados.</p>}
      {!loading && grupos.map((g, i) => (
        <Card key={i} size="small" style={{ marginBottom: 8, borderRadius: 8 }}
          styles={{ body: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' } }}>
          <div>
            <strong>{DIAS[g.day_of_week]}</strong>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              {String(g.hour_start).padStart(2, '0')}:00 — {String(g.hour_end).padStart(2, '0')}:00
              {g.label && <Tag style={{ marginLeft: 8 }}>{g.label}</Tag>}
            </div>
          </div>
          <Popconfirm title="¿Eliminar este bloqueo?" onConfirm={() => handleDelete(g.ids)} okText="Sí" cancelText="No">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Card>
      ))}
    </div>
  );
}

// ── TAB 2: EVENTOS / FECHAS ESPECIALES ───────────────────────────────────────
function EventosTab() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllBlocks();
      setExceptions(res?.exceptions || res?.date_exceptions || []);
    } catch { message.error('Error al cargar eventos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExceptions(); }, []);

  const onFinish = async (values) => {
    const start = Number(values.hour_start);
    const end = Number(values.hour_end);
    if (end <= start) return message.error('La hora de fin debe ser mayor a la de inicio.');
    try {
      await adminService.addExceptionBlock({
        date: values.date.format('YYYY-MM-DD'),
        hour_start: start,
        hour_end: end,
        status: 'blocked',
        label: values.label || 'No disponible'
      });
      message.success('Evento bloqueado.');
      form.resetFields();
      fetchExceptions();
    } catch { message.error('Error al bloquear.'); }
  };

  const handleDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => adminService.deleteExceptionBlock(id)));
      message.success('Desbloqueado.');
      fetchExceptions();
    } catch { message.error('Error al eliminar.'); }
  };

  function agruparExcepciones(rows) {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
    const grupos = [];
    for (const r of sorted) {
      const last = grupos[grupos.length - 1];
      if (last && last.date === r.date && last.label === r.label && last.hour_end === r.hour) {
        last.hour_end = r.hour + 1;
        last.ids.push(r.id);
      } else {
        grupos.push({ date: r.date, hour_start: r.hour, hour_end: r.hour + 1, label: r.label, ids: [r.id] });
      }
    }
    return grupos;
  }

  const grupos = agruparExcepciones(exceptions);
  const esDiaCompleto = (g) => g.hour_start === 0 && g.hour_end === 24;

  return (
    <div>
      <Card title="Bloquear evento / fecha especial" size="small" style={{ marginBottom: 20 }}>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
          El cliente verá estos horarios como <strong>No disponible</strong>.
        </p>
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="date" label="Fecha" rules={[{ required: true, message: 'Seleccioná una fecha' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={c => c && c.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          <Space style={{ display: 'flex', width: '100%' }} align="baseline">
            <Form.Item name="hour_start" label="Desde" rules={[{ required: true, message: 'Requerido' }]} style={{ flex: 1 }}>
              <Select placeholder="Inicio">
                {HORAS.map(h => <Select.Option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="hour_end" label="Hasta" rules={[{ required: true, message: 'Requerido' }]} style={{ flex: 1 }}>
              <Select placeholder="Fin">
                {HORAS.map(h => <Select.Option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</Select.Option>)}
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="label" label="Motivo">
            <Input placeholder="Ej: Feriado, Viaje, Médico..." />
          </Form.Item>
          <Button type="primary" danger htmlType="submit" icon={<PlusOutlined />} block>
            Bloquear
          </Button>
        </Form>
      </Card>

      <h4 style={{ marginBottom: 10 }}>Eventos bloqueados ({grupos.length})</h4>
      {loading && <p>Cargando...</p>}
      {!loading && grupos.length === 0 && <p style={{ color: '#999' }}>No hay eventos bloqueados.</p>}
      {!loading && grupos.map((g, i) => (
        <Card key={i} size="small" style={{ marginBottom: 8, borderRadius: 8 }}
          styles={{ body: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' } }}>
          <div>
            <strong>{dayjs(g.date).format('dddd D [de] MMMM')}</strong>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              {esDiaCompleto(g)
                ? <Tag color="red">Día completo</Tag>
                : `${String(g.hour_start).padStart(2, '0')}:00 — ${String(g.hour_end).padStart(2, '0')}:00`}
              {g.label && <Tag color="orange" style={{ marginLeft: 4 }}>{g.label}</Tag>}
            </div>
          </div>
          <Popconfirm title="¿Desbloquear?" onConfirm={() => handleDelete(g.ids)} okText="Sí" cancelText="No">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Card>
      ))}
    </div>
  );
}

export default function FixedSchedules() {
  const tabsItems = [
    { key: '1', label: 'Días Fijos', children: <SemanalesTab /> },
    { key: '2', label: 'Fechas Especiales', children: <EventosTab /> },
  ];
  return (
    <div>
      <h3 style={{ fontFamily: 'Georgia, serif', marginBottom: 12, marginTop: 4 }}>Bloqueos de Agenda</h3>
      <Tabs defaultActiveKey="1" items={tabsItems} />
    </div>
  );
}