import React, { useState } from 'react';
import { List, Button, Typography, Card, theme } from 'antd';
import ReservationModal from './ReservationModal';
import dayjs from 'dayjs';

const { Text } = Typography;

const TimeSlotPicker = ({ slots, selectedDate, settings, onRefresh }) => {
  const { token } = theme.useToken();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  const handleSelectSlot = (slot) => {
    if (slot.available) {
      setActiveSlot(slot);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Card style={{ width: '100%' }} styles={{ body: { padding: 0 } }}>
        <List
          style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}
          dataSource={slots}
          locale={{ emptyText: 'No hay horarios configurados para este día.' }}
          renderItem={(item) => (
            <List.Item style={{ display: 'flex', padding: 0, alignItems: 'stretch' }}>
              
              {/* Hora en IBM Plex Mono */}
              <div style={{
                width: '80px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                backgroundColor: token.colorBgElevatedD,
              }}>
                <Text strong style={{ color: token.colorTextSecondaryD, fontFamily: '"IBM Plex Mono", Courier, monospace', fontSize: '15px' }}>
                  {item.time}
                </Text>
              </div>

              {/* Botón */}
              <div style={{ flex: 1, display: 'flex' }}>
                <Button
                  type="text"
                  disabled={!item.available}
                  onClick={() => handleSelectSlot(item)}
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'left',
                    padding: '12px 24px',
                    borderRadius: 0,
                    color: item.available ? token.colorPrimary : token.colorTextDisabled,
                    fontFamily: '"IBM Plex Mono", Courier, monospace',
                    fontWeight: '600',
                  }}
                >
                  {item.available ? (item.label || 'Disponible') : (item.label || 'No disponible')}
                </Button>
              </div>
            </List.Item>
          )}
        />
      </Card>

      {activeSlot && (
        <ReservationModal 
          isOpen={isModalOpen}
          onClose={(shouldRefresh) => {
            setIsModalOpen(false);
            if (shouldRefresh) onRefresh(); // Recarga la lista si se completó la reserva
          }}
          selectedDate={selectedDate} // Pasamos el objeto dayjs entero para procesarlo adentro
          activeHour={activeSlot.id}  // El id mapea directamente el número de la hora (0-23)
          settings={settings}
        />
      )}
    </>
  );
};

export default TimeSlotPicker;