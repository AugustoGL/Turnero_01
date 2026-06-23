import React from 'react';
import { Calendar, Select, Typography, theme, ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');
const { Text } = Typography;

const SelectDate = ({ value, onChange }) => {
  const { token } = theme.useToken();

  // El backend bloquea días anteriores y turnos con más de 30 días de anticipación
  const disabledDate = (current) => {
    if (!current) return false;
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const maxDate = dayjs().add(30, 'days').endOf('day');
    return current.isBefore(tomorrow) || current.isAfter(maxDate);
  };

  const customHeaderRender = ({ value: currentDate, onChange: onHeaderChange }) => {
    const localeData = currentDate.localeData();
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(localeData.monthsShort(currentDate.month(i)));
    }
    const currentMonth = currentDate.month();
    const currentMonthLabel = localeData.months(currentDate);

    return (
      <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ textTransform: 'capitalize', fontSize: '16px', fontFamily: 'Georgia, serif' }}>
          {currentMonthLabel}
        </Text>
        <Select
          size="small"
          popupMatchSelectWidth={false} 
          value={currentMonth}
          onChange={(newMonth) => onHeaderChange(currentDate.month(newMonth))}
          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
        >
          {months.map((monthName, index) => (
            <Select.Option key={index} value={index}>{monthName}</Select.Option>
          ))}
        </Select>
      </div>
    );
  };

  return (
    <ConfigProvider locale={esES}>
      <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px', border: `1px solid ${token.colorBorderSecondary}` }}>
        <style>{`
          .ant-picker-cell-inner { font-family: "IBM Plex Mono", Courier, monospace !important; font-weight: 500 !important; }
          .ant-picker-content th { font-family: "IBM Plex Mono", Courier, monospace !important; font-size: 12px; }
        `}</style>
        <Calendar
          fullscreen={false}
          value={value}
          onSelect={onChange}
          disabledDate={disabledDate}
          headerRender={customHeaderRender}
        />
      </div>
    </ConfigProvider>
  );
};

export default SelectDate;