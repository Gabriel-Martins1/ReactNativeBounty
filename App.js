import { useState, useEffect } from 'react';
import { Appearance, StyleSheet, Text, View } from 'react-native';
import * as Battery from 'expo-battery';
import * as Notifications from 'expo-notifications';

// Configura como o app deve se comportar ao RECEBER uma notificação
// enquanto está aberto (em foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [tema, setTema] = useState(Appearance.getColorScheme());
  const [nivelBateria, setNivelBateria] = useState(null);
  const [permissaoNotificacao, setPermissaoNotificacao] = useState(null);

  // M01 - Appearance
  useEffect(() => {
    const assinatura = Appearance.addChangeListener(({ colorScheme }) => {
      setTema(colorScheme);
    });
    return () => assinatura.remove();
  }, []);

  // M02 - Battery
  useEffect(() => {
    const lerNivelBateria = async () => {
      const nivel = await Battery.getBatteryLevelAsync();
      setNivelBateria(nivel);
    };

    lerNivelBateria();

    const assinaturaBateria = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setNivelBateria(batteryLevel);
    });

    const intervalo = setInterval(lerNivelBateria, 10000);

    return () => {
      assinaturaBateria.remove();
      clearInterval(intervalo);
    };
  }, []);

  // M03 - Notifications: pedir permissão ao abrir o app
  useEffect(() => {
    const pedirPermissao = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissaoNotificacao(status);
    };
    pedirPermissao();
  }, []);

  const ehTemaEscuro = tema === 'dark';
  const porcentagemBateria = nivelBateria !== null ? Math.round(nivelBateria * 100) : null;

  return (
    <View style={[styles.container, ehTemaEscuro ? styles.fundoEscuro : styles.fundoClaro]}>
      <Text style={ehTemaEscuro ? styles.textoClaro : styles.textoEscuro}>
        Check-in de Estudos
      </Text>
      <Text style={ehTemaEscuro ? styles.textoClaro : styles.textoEscuro}>
        Tema do sistema: {ehTemaEscuro ? 'Escuro' : 'Claro'}
      </Text>
      <Text style={ehTemaEscuro ? styles.textoClaro : styles.textoEscuro}>
        Bateria: {porcentagemBateria !== null ? `${porcentagemBateria}%` : 'Carregando...'}
      </Text>
      <Text style={ehTemaEscuro ? styles.textoClaro : styles.textoEscuro}>
        Permissão de notificação: {permissaoNotificacao ?? 'Verificando...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  fundoEscuro: { backgroundColor: '#121212' },
  fundoClaro: { backgroundColor: '#ffffff' },
  textoClaro: { color: '#ffffff', fontSize: 16 },
  textoEscuro: { color: '#000000', fontSize: 16 },
});