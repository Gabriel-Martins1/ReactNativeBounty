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

  useEffect(() => {
    const lerNivelBateria = async () => { // função assíncrona é um tipo de função que inicia uma tarefa demorada e permite que o restante do programa continue
                                          //  rodando em paralelo
      const nivel = await Battery.getBatteryLevelAsync(); //getbatterylevel consultar o nível atual da bateria (faz uma requisição p OS do cllr)
      setNivelBateria(nivel); //
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

  useEffect(() => {
    const pedirPermissao = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissaoNotificacao(status);
    };
    pedirPermissao();
  }, []);

  useEffect(() => {
    if (nivelBateria === null) return; // isso aqui é pq quando vc acaba de abrir o app o nivel de bateria é vazio
    const porcentagem = nivelBateria * 100;  //pega a porcentagem da bateria, pq a baterira normalmente é 0-1.0
    if (porcentagem < 20 && !avisoBateriaDisparadoRef.current) { A
      avisoBateriaDisparadoRef.current = true;
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bateria baixa!',
          body: `Sua bateria está em ${Math.round(porcentagem)}%. Considere carregar o celular.`,
        },
        trigger: null,
      });
    }
    if (porcentagem >= 20) { //se bateria 
      avisoBateriaDisparadoRef.current = false;
    }
  }, [nivelBateria]); //dependencia

  const iniciarCronometro = () => {
    const minutos = parseFloat(minutosInput);
    if (isNaN(minutos) || minutos <= 0) {
      alert('Digite um número de minutos válido.');
      return; //verificação
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

  // Define a cor da bateria conforme o nível (visual de alerta)
  const corBateria =
    porcentagemBateria === null ? '#999' : porcentagemBateria < 20 ? '#e74c3c' : '#2ecc71';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Check-in de Estudos</Text>
      </View>

      <View style={styles.cardBateria}>
        <Text style={styles.labelBateria}>Bateria do dispositivo</Text>
        <Text style={[styles.valorBateria, { color: corBateria }]}>
          {porcentagemBateria !== null ? `${porcentagemBateria}%` : '...'}
        </Text>
        <View style={styles.barraFundo}>
          <View
            style={[
              styles.barraPreenchida,
              { width: `${porcentagemBateria ?? 0}%`, backgroundColor: corBateria },
            ]}
          />
        </View>
      </View>

      {!cronometroAtivo ? (
        <View style={styles.cardConfiguracao}>
          <Text style={styles.label}>Quantos minutos você vai estudar?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={minutosInput}
            onChangeText={setMinutosInput}
            placeholder="Ex: 25"
            placeholderTextColor="#aaa"
          />
          <View style={styles.botaoPrimario}>
            <Button title=" Iniciar sessão" onPress={iniciarCronometro} color="#fff" />
          </View>
        </View>
      ) : (
        <View style={styles.cardCronometro}>
          <Text style={styles.labelCronometro}>Tempo restante</Text>
          <Text style={styles.contador}>
            {String(minutosExibicao).padStart(2, '0')}:{String(segundosExibicao).padStart(2, '0')}
          </Text>
          <View style={styles.botaoSecundario}>
            <Button title="■  Parar sessão" onPress={pararCronometro} color="#fff" />
          </View>
        </View>
      )}

      <Text style={styles.rodape}>
        Notificações: {permissaoNotificacao === 'granted' ? ' Ativas' : ' Pendente'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  header: {
    marginBottom: 8,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },

  cardBateria: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  labelBateria: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valorBateria: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },
  barraFundo: {
    width: '100%',
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barraPreenchida: {
    height: '100%',
    borderRadius: 4,
  },

  cardConfiguracao: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    color: '#34495e',
    fontWeight: '500',
  },
  input: {
    width: 120,
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 10,
    padding: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
  },
  botaoPrimario: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },

  cardCronometro: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  labelCronometro: {
    fontSize: 13,
    color: '#7f8c8d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contador: {
    fontSize: 56,
    fontWeight: '700',
    color: '#2c3e50',
  },
  botaoSecundario: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },

  rodape: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 8,
  },
});