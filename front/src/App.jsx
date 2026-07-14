import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  ConfigProvider,
  Layout,
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
} from "antd";
import { LockOutlined } from "@ant-design/icons";
import axios from "axios";

import MainClient from "./Pages/mainClient";
import BookingsManager from "./admin/pages/BookingsManager";
import FixedSchedules from "./admin/pages/FixedSchedules"; 
import SettingsManager from "./admin/pages/SettingsManager"; 
import AdminLayoutContent from "./admin/AdminLayout";
import Login from "./admin/Login";

const { Title } = Typography;

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/session', { withCredentials: true })
      .then(res => {
        if (res.data && res.data.authenticated) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(err => {
        setIsAdmin(false);
        console.error("Error de conexión al verificar sesión:", err);
      })
      .finally(() => {
        // 🔥 LA CLAVE: Desactivamos la pantalla de carga pase lo que pase
        setCheckingSession(false);
      });
  }, []);

  if (checkingSession) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          fontSize: "16px",
          color: "#52606D"
        }}
      >
        Cargando agenda...
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6B8E6E",
          colorPrimaryHover: "#7FA382",
          colorPrimaryActive: "#58765A",

          colorSecondary: "#A3B18A",
          colorSecondaryHover: "#B3BE9D",
          colorSecondaryActive: "#8E9C75",

          colorBg: "#F7F8F4",
          colorBgContainer: "#FFFFFF",
          colorBgElevated: "#EEF1E7",

          colorBorder: "#D8DDD0",

          colorText: "#1F2933",
          colorTextSecondary: "#52606D",
          colorTextLightSolid: "#FFFFFF",

          borderRadius: 12,

          colorPrimaryD: "#A3B18A",
          colorPrimaryHoverD: "#B4C29D",
          colorPrimaryActiveD: "#8A9A72",

          colorSecondaryD: "#6B8E6E",
          colorSecondaryHoverD: "#7FA382",
          colorSecondaryActiveD: "#58765A",

          colorBgD: "#1C241F",
          colorBgContainerD: "#253028",
          colorBgElevatedD: "#2D3A31",

          colorBorderD: "#3B4A3F",

          colorTextD: "#F5F7F2",
          colorTextSecondaryD: "#C5CEC0",
          colorTextLightSolidD: "#1C241F",
        },
        components: {
          Input: { controlHeight: 46, fontSize: 16 },
          InputNumber: { controlHeight: 46, fontSize: 16 },
          Select: { controlHeight: 46, fontSize: 16 },
          DatePicker: { controlHeight: 46, fontSize: 16 },
          Button: { controlHeight: 46, fontSize: 16, fontWeight: 600 },
          Form: { itemMarginBottom: 20 }, 
        },
      }}
    >
      <div
        style={{
          margin: "0 auto",
          backgroundColor:  "#F7F8F4",
          minHeight: "100vh",
        }}
      >
        <Routes>
          <Route path="/" element={<MainClient />} />
          <Route
            path="/admin/login"
            element={
              isAdmin ? (
                <Navigate to="/admin/bookings" replace />
              ) : (
                <Login onLoginSuccess={() => setIsAdmin(true)} />
              )
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <AdminLayoutContent isAdmin={isAdmin}>
                <BookingsManager />
              </AdminLayoutContent>
            }
          />
          <Route
            path="/admin/fixed"
            element={
              <AdminLayoutContent isAdmin={isAdmin}>
                <FixedSchedules />
              </AdminLayoutContent>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminLayoutContent isAdmin={isAdmin}>
                <SettingsManager onLogout={() => setIsAdmin(false)} />
              </AdminLayoutContent>
            }
          />

          <Route
            path="/admin"
            element={<Navigate to="/admin/bookings" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ConfigProvider>
  );
}