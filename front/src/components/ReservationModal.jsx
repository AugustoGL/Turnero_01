import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, message } from 'antd';
import { publicService } from '../services';

const { Text, Title } = Typography;

export default function ReservationModal({ isOpen, onClose, selectedDate, activeHour, settings }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);

  const fechaFormateada = selectedDate ? selectedDate.format('dddd D [de] MMMM') : '';
  const horaFormateada = activeHour !== undefined && activeHour !== null
    ? `${String(activeHour).padStart(2, '0')}:00 a ${String(activeHour + 1).padStart(2, '0')}:00 hs`
    : '';

  const precioClase = Number(settings?.default_price || 10000);
  const valorSeña = Number(settings?.default_deposit_amount || 0); // ← monto fijo, sin cálculo
  const whatsappNumber = settings?.mom_whatsapp || '';

  const handleNextStep = (values) => {
    setFormData(values);
    setStep(2);
  };

  const handleConfirmarReserva = async () => {
    try {
      setLoading(true);
      const payload = {
        date: selectedDate.format('YYYY-MM-DD'),
        hour: Number(activeHour),
        student_name: formData.student_name,
        student_lastname: formData.student_lastname,
        subject: formData.subject,
        contact: formData.contact,
        extra_info: formData.extra_info || ''
      };

      const res = await publicService.createBooking(payload);

      if (res.success || res.ok) {
        message.success('¡Turno congelado por 30 minutos!');
       const mensaje =
`¡Hola! Quiero reservar una clase 📚
👤 *Alumno:* ${formData.student_name} ${formData.student_lastname}
📅 *Fecha:* ${fechaFormateada}
🕐 *Horario:* ${horaFormateada}
📖 *Materia/Tema:* ${formData.subject}
📱 *Contacto:* ${formData.contact}
${formData.extra_info ? `📝 *Notas:* ${formData.extra_info}` : ''}
💰 *Costo de la clase:* $${precioClase.toLocaleString('es-AR')}
💵 *Seña:* $${valorSeña.toLocaleString('es-AR')}
🧾 *Total:* $${(precioClase + valorSeña).toLocaleString('es-AR')}`;
        const url = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
        form.resetFields();
        setStep(1);
        onClose(true);
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Este horario ya fue reservado o no está disponible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={() => { setStep(1); onClose(false); }}
      footer={null}
      centered
      destroyOnHidden={true}
      title={<Title level={3} style={{ margin: 0, fontFamily: 'Georgia, serif' }}>Confirmar reserva</Title>}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        Paso {step} de 2
      </Text>

      {step === 1 && (
        <Form form={form} layout="vertical" onFinish={handleNextStep}>
          <Form.Item name="student_name" label="Nombre" rules={[{ required: true, message: 'Ingresá tu nombre' }]}>
            <Input placeholder="Ej: Juan" />
          </Form.Item>
          <Form.Item name="student_lastname" label="Apellido" rules={[{ required: true, message: 'Ingresá tu apellido' }]}>
            <Input placeholder="Ej: Pérez" />
          </Form.Item>
          <Form.Item name="subject" label="Materia / Tema" rules={[{ required: true, message: '¿Qué materia vas a repasar?' }]}>
            <Input placeholder="Ej: Análisis Matemático, Álgebra..." />
          </Form.Item>
          <Form.Item name="contact" label="Teléfono de contacto (WhatsApp)" rules={[{ required: true, message: 'Falta tu número' }]}>
            <Input placeholder="Ej: 3512345678" />
          </Form.Item>
          <Form.Item name="extra_info" label="Notas u observaciones (Opcional)">
            <Input.TextArea rows={2} placeholder="Dejá acá dudas o temas específicos si querés..." />
          </Form.Item>
          <Button type="primary" block size="large" htmlType="submit" style={{ marginTop: 10, fontWeight: 'bold' }}>
            Siguiente
          </Button>
        </Form>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#f6ffed',
            border: '1px dashed #b7eb8f',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '8px'
          }}>
            <Title level={4} style={{ margin: '0 0 4px 0', textTransform: 'capitalize' }}>{fechaFormateada}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>Horario: {horaFormateada}</Text>

            <hr style={{ border: 'none', borderTop: '1px dashed #d9d9d9', marginBottom: '16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text>Precio de la clase</Text>
              <Text strong>${precioClase.toLocaleString('es-AR')}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Text>Valor de la seña</Text>
              <Text strong>${valorSeña.toLocaleString('es-AR')}</Text>
            </div>
            <hr style={{ border: 'none', borderTop: '1px dashed #b7eb8f', marginBottom: '16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: '16px' }}>Total a pagar</Text>
              <Title level={3} style={{ margin: 0, fontWeight: 'bold' }}>${valorSeña.toLocaleString('es-AR')}</Title>
            </div>
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            onClick={handleConfirmarReserva}
            style={{
              height: '50px',
              backgroundColor: '#6b8e73',
              borderColor: '#6b8e73',
              fontWeight: 'bold',
              borderRadius: '10px',
              fontSize: '16px'
            }}
          >
            Reservar este horario
          </Button>
          <Button
            type="link"
            block
            onClick={() => setStep(1)}
            style={{ color: '#595959', textDecoration: 'underline' }}
          >
            Volver a modificar datos
          </Button>
        </div>
      )}
    </Modal>
  );
}