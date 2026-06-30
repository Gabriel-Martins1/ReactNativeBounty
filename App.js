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

  const intervaloRef = useRef(null); //useref pode mudar, mas sem atualizar na tela
  const avisoTempoDisparadoRef = useRef(false);
  const avisoBateriaDisparadoRef = useRef(false);

  useEffect(() => {
    const lerNivelBateria = async () => { // função assíncrona é um tipo de função que inicia uma tarefa demorada e permite que o restante do programa continue
                                          //  rodando em paralelo
                                          //isso n funciona mt bem no android pq o android so manda a atualização de bateria a cada mudança significativa 
      const nivel = await Battery.getBatteryLevelAsync(); //getbatterylevel consultar o nível atual da bateria (faz uma requisição p OS do cllr)
      setNivelBateria(nivel); //coloca a bateria no setnivelbateria
    };
    //Roda a função imediatamente para pegar a bateria assim que o app abre
    lerNivelBateria();
    const assinaturaBateria = Battery.addBatteryLevelListener(({ batteryLevel }) => { //avisa o app toda vez que a bateria mudar (Listener é tipo um vigia que ve quando muda)
      setNivelBateria(batteryLevel);
    });
    //le o nivel de bateria a cada 10 segundos. 
    const intervaloBateria = setInterval(lerNivelBateria, 10000);
    return () => {
      assinaturaBateria.remove(); //esse return existe pra quando o app fechar o app nao coontinuar roubando o processamento do celular e mandando requisição pro sistema operacionar (OS)
      clearInterval(intervaloBateria);
    };
  }, []);

  useEffect(() => {
    const pedirPermissao = async () => { //função assincrona é um tipo de função que inicia uma tarefa demorada e permite que o restante do programa continue rodando em paralelo
      const { status } = await Notifications.requestPermissionsAsync(); //aparece na tela a telinha de pedir permissão da notificação 
      setPermissaoNotificacao(status); //status determina o status da permissão
    };
    pedirPermissao(); 
  }, []);

  useEffect(() => {
    if (nivelBateria === null) return; // isso aqui é pq quando vc acaba de abrir o app o nivel de bateria é vazio
    const porcentagem = nivelBateria * 100;  //pega a porcentagem da bateria, pq a baterira normalmente é 0-1.0
    if (porcentagem < 20 && !avisoBateriaDisparadoRef.current) { A //se a porcentagem for menor que 20 e NAO (!) foi enviado o aviso 
      avisoBateriaDisparadoRef.current = true; //manda o aviso
      Notifications.scheduleNotificationAsync({   //manda notificação de forma assincrona (significa que o seu aplicativo vai pedir para o celular criar uma notificação,
                                                  //mas sem travar o restante do aplicativo enquanto esse pedido e processado)
        content: {
          title: 'Bateria baixa!',
          body: `Sua bateria está em ${Math.round(porcentagem)}%. Considere carregar o celular.`, //arredonda pra nao aparecer 19.99999% de bateria
        },
        trigger: null, //faz o aviso aparecer na mesma hora
      });
    }
    if (porcentagem >= 20) { //se bateria for maior ou = a 20 
      avisoBateriaDisparadoRef.current = false; //nao aparece o aviso de bateria
    }
  }, [nivelBateria]); //dependencia é o nivel da bateria

  const iniciarCronometro = () => {
    const minutos = parseFloat(minutosInput); //parsefloat transforma str em numero
    if (isNaN(minutos) || minutos <= 0) { //nao é um numero OU minutos é menor ou = a 0
      alert('Digite um número de minutos válido.');
      return; //verificação
    }
    const totalSegundos = Math.round(minutos * 60); //arredonda pra nao ficar 10.555 segundos por ex
    setTempoTotalSegundos(totalSegundos); //mexe no useState
    setSegundosRestantes(totalSegundos); //useState
    avisoTempoDisparadoRef.current = false; //falso pq o cronometro nasce sem disparar um aviso
    setCronometroAtivo(true); //ativa o cronometro
  };

  const pararCronometro = () => {
    setCronometroAtivo(false); //tira o cronometro do true, desativa ele
    clearInterval(intervaloRef.current); //clear interval serve para parar e destruir um temporizador
  };

  useEffect(() => {
    if (!cronometroAtivo) return; //verificacao, se n tiver ativo n ve esse useffect 
    intervaloRef.current = setInterval(() => { 
      setSegundosRestantes((segundosAnteriores) => { 
        const proximoValor = segundosAnteriores - 1; //proximo valor é o segundo anterior -1
        if (proximoValor <= 0) {  //se o proximo valor (segundo anterior -1) for menor ou igual a 0:
          clearInterval(intervaloRef.current); //limpa o intervalo
          setCronometroAtivo(false); //Desativa o cronometro
          return 0; //volta a ser 0
        }
        const limiteAviso = tempoTotalSegundos * 0.1; // o aviso é 10% do vaor total q eu coloquei lá 
        if (proximoValor <= limiteAviso && !avisoTempoDisparadoRef.current) { //se o proximovalor for menor ou igual o limite e o aviso nao foo desparado ainda:
          avisoTempoDisparadoRef.current = true; //ativa o aviso 
          Vibration.vibrate([0, 300, 150, 300]); // vibra, para por um tempo, vibra dnv (no IOS ele vibra por 4MS, depois para e depois vibra por 4MS dnv)
          Notifications.scheduleNotificationAsync({ //aparece a notificação 
            content: {
              title: 'Tempo quase acabando!',
              body: 'Faltam poucos minutos para o fim da sua sessão de estudo.',
            },
            trigger: null,
          });
        }
        return proximoValor;
      });
    }, 1000); //lê de 1 em 1 segundo 
    return () => clearInterval(intervaloRef.current); //se fechar a aba o cronometro para de rodar
  }, [cronometroAtivo, tempoTotalSegundos]); //dependencias

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