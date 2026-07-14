import { useEffect, useState } from "react";
import { App, Flex, Typography, Row, Col, theme, Spin } from "antd";
import SelectDate from "../components/SelectDate";
import TimeSlotPicker from "../components/TimeSlotPicker";
import dayjs from "dayjs";
import axios from "axios";

const { Title, Text } = Typography;
const API_BASE = "/api/public";

export default function MainDefault() {
  return (
    <App>
      <MainClientContent />
    </App>
  );
}

function MainClientContent() {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day'));
  const [slots, setSlots] = useState([]);
  const [settings, setSettings] = useState({ business_name: 'Clases particulares' });
  const [loading, setLoading] = useState(false);

  // Cargar configuración inicial del negocio
  useEffect(() => {
    axios.get(`${API_BASE}/settings`)
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(err => {
        console.error("Error cargando settings:", err);
      });
  }, []);

  // Consultar disponibilidad de turnos al cambiar de fecha
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    const dateStr = selectedDate.format("YYYY-MM-DD");

    axios.get(`${API_BASE}/availability?date=${dateStr}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          const formattedSlots = res.data.map(s => ({
            id: s.hour,
            time: `${String(s.hour).padStart(2, '0')}:00`,
            available: s.status === 'available',
            label: s.label || ''
          }));
          setSlots(formattedSlots);
        }
      })
      .catch(err => {
        console.error("Error buscando disponibilidad:", err);
        message.error("No se pudo obtener la disponibilidad de horarios.");
      })
      .finally(() => setLoading(false));
  }, [selectedDate, message]);

  return (
    <div style={{ minHeight: "(100vh-16px)", padding: "40px 16px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Cabecera de la App */}
        <Flex vertical style={{ marginBottom: "30px" }}>
          <Title level={2} style={{ margin: 0, fontFamily: 'Georgia, serif' }}>
            {settings.business_name || 'Clases Particulares'}
          </Title>
          <Text style={{ color: token.colorTextSecondary, fontSize: '16px' }}>
            Profe Nati
          </Text>
        </Flex>

        {/* Sección de Selección y Agenda */}
        <Row gutter={[32, 24]}>
          <Col xs={24} md={12}>
            <SelectDate value={selectedDate} onChange={setSelectedDate} />
          </Col>

          <Col xs={24} md={12}>
            {loading ? (
              <Flex justify="center" align="middle" style={{ height: '200px' }}>
                <Spin size="large" description="Cargando horarios..." />
              </Flex>
            ) : (
              <TimeSlotPicker
                slots={slots}
                selectedDate={selectedDate}
                settings={settings}
                onRefresh={() => setSelectedDate(selectedDate.clone())}
              />
            )}
          </Col>
        </Row>

      </div>
    </div>
  );
}