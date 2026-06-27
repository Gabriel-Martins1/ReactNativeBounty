import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Vibration } from 'react-native';
import * as Battery from 'expo-battery';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [nivelBateria, setNivelBateria] = useState(null);
  const [permissaoNotificacao, setPermissaoNotificacao] = useState(null);

  const [minutosInput, setMinutosInput] = useState('5');
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [tempoTotalSegundos, setTempoTotalSegundos] = useState(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);

  const intervaloRef = useRef(null);
  const avisoTempoDisparadoRef = useRef(false);
  const avisoBateriaDisparadoRef = useRef(false);

  // Battery
  useEffect(() => {
    const lerNivelBateria = async () => {
      const nivel = await Battery.getBatteryLevelAsync();
      setNivelBateria(nivel);
    };
    lerNivelBateria();
    const assinaturaBateria = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setNivelBateria(batteryLevel);
    });
    const intervaloBateria = setInterval(lerNivelBateria, 10000);
    return () => {
      assinaturaBateria.remove();
      clearInterval(intervaloBateria);
    };
  }, []);

  // Notifications: permissão
  useEffect(() => {
    const pedirPermissao = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissaoNotificacao(status);
    };
    pedirPermissao();
  }, []);

  // Aviso de bateria baixa (abaixo de 20%), disparado uma única vez por queda
  useEffect(() => {
    if (nivelBateria === null) return;

    const porcentagem = nivelBateria * 100;

    if (porcentagem < 20 && !avisoBateriaDisparadoRef.current) {
      avisoBateriaDisparadoRef.current = true;
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bateria baixa!',
          body: `Sua bateria está em ${Math.round(porcentagem)}%. Considere carregar o celular.`,
        },
        trigger: null,
      });
    }

    // Reseta o aviso se a bateria subir de novo acima de 20% (ex: ligou o carregador)
    if (porcentagem >= 20) {
      avisoBateriaDisparadoRef.current = false;
    }
  }, [nivelBateria]);

  const iniciarCronometro = () => {
    const minutos = parseFloat(minutosInput);

    if (isNaN(minutos) || minutos <= 0) {
      alert('Digite um número de minutos válido.');
      return;
    }

    const totalSegundos = Math.round(minutos * 60);
    setTempoTotalSegundos(totalSegundos);
    setSegundosRestantes(totalSegundos);
    avisoTempoDisparadoRef.current = false;
    setCronometroAtivo(true);
  };

  const pararCronometro = () => {
    setCronometroAtivo(false);
    clearInterval(intervaloRef.current);
  };

  // Contagem regressiva + verificação do aviso de "tempo quase acabando"
  useEffect(() => {
    if (!cronometroAtivo) return;

    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((segundosAnteriores) => {
        const proximoValor = segundosAnteriores - 1;

        if (proximoValor <= 0) {
          clearInterval(intervaloRef.current);
          setCronometroAtivo(false);
          return 0;
        }

        // Verifica se entrou nos últimos 10% do tempo total
        const limiteAviso = tempoTotalSegundos * 0.1;
        if (proximoValor <= limiteAviso && !avisoTempoDisparadoRef.current) {
          avisoTempoDisparadoRef.current = true;
          Vibration.vibrate([0, 300, 150, 300]);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Tempo quase acabando!',
              body: 'Faltam poucos minutos para o fim da sua sessão de estudo.',
            },
            trigger: null,
          });
        }

        return proximoValor;
      });
    }, 1000);

    return () => clearInterval(intervaloRef.current);
  }, [cronometroAtivo, tempoTotalSegundos]);

  const minutosExibicao = Math.floor(segundosRestantes / 60);
  const segundosExibicao = segundosRestantes % 60;
  const porcentagemBateria = nivelBateria !== null ? Math.round(nivelBateria * 100) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Check-in de Estudos</Text>

      <Text style={styles.texto}>
        Bateria: {porcentagemBateria !== null ? `${porcentagemBateria}%` : 'Carregando...'}
      </Text>

      {!cronometroAtivo ? (
        <View style={styles.areaInput}>
          <Text style={styles.texto}>Minutos de estudo:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={minutosInput}
            onChangeText={setMinutosInput}
          />
          <Button title="Iniciar sessão" onPress={iniciarCronometro} />
        </View>
      ) : (
        <View style={styles.areaContador}>
          <Text style={styles.contador}>
            {String(minutosExibicao).padStart(2, '0')}:{String(segundosExibicao).padStart(2, '0')}
          </Text>
          <Button title="Parar sessão" onPress={pararCronometro} color="red" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#fff', padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  texto: { fontSize: 16, color: '#000' },
  areaInput: { alignItems: 'center', gap: 10 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 10, width: 100, textAlign: 'center', fontSize: 18 },
  areaContador: { alignItems: 'center', gap: 10 },
  contador: { fontSize: 48, fontWeight: 'bold' },
});