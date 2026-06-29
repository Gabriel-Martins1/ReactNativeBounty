
# Documentação das APIs — Check-in de Estudos

## 1. expo-battery

- **Tipo:** Módulo do Expo SDK
- **Instalação:** `npx expo install expo-battery`
- **Documentação oficial:** https://docs.expo.dev/versions/v54.0.0/sdk/battery/

**O que faz no projeto:**
Monitora o nível de bateria do dispositivo em tempo real e exibe a porcentagem na tela. Quando a bateria cai abaixo de 20%, dispara automaticamente uma notificação de alerta.

**Por que faz sentido no cenário:**
Durante uma sessão de estudo, o usuário pode esquecer de verificar a bateria do celular. Avisar quando ela estiver baixa evita que o cronômetro seja interrompido por falta de energia no meio da sessão.

**Funções utilizadas:**
- `getBatteryLevelAsync()`: lê o nível de bateria atual (retorna um número entre 0 e 1).
- `addBatteryLevelListener()`: tenta escutar mudanças automáticas de bateria.

---

## 2. expo-notifications

- **Tipo:** Módulo do Expo SDK
- **Instalação:** `npx expo install expo-notifications`
- **Documentação oficial:** https://docs.expo.dev/versions/v54.0.0/sdk/notifications/

**O que faz no projeto:**
Envia notificações locais (geradas pelo próprio app, sem servidor) em dois momentos: quando o cronômetro entra nos últimos 10% do tempo, e quando a bateria cai abaixo de 20%.

**Por que faz sentido no cenário:**
O usuário pode estar com o celular minimizado durante o estudo (focado em livros físicos, por exemplo). A notificação garante que ele saiba que o tempo está acabando mesmo sem estar olhando a tela do app.

**Funções utilizadas:**
- `requestPermissionsAsync()`: solicita permissão do usuário para enviar notificações.
- `setNotificationHandler()`: configura como o app reage a notificações recebidas enquanto está aberto.
- `scheduleNotificationAsync()`: dispara a notificação (usamos `trigger: null` para disparo imediato).

---

## 3. Vibration (React Native core)

- **Tipo:** API nativa do React Native (não precisa instalação)
- **Documentação oficial:** https://reactnative.dev/docs/vibration

**O que faz no projeto:**
Faz o celular vibrar em um padrão de alerta (vibra, pausa, vibra) quando o cronômetro entra nos últimos 10% do tempo, simultaneamente à notificação.

**Por que faz sentido no cenário:**
Vibração é um canal de aviso adicional à notificação visual/sonora — útil caso o celular esteja no modo silencioso, garantindo que o usuário perceba o aviso por meio do toque.

**Função utilizada:**
- `Vibration.vibrate([0, 300, 150, 300])`: dispara um padrão de vibração customizado (array alternando pausa/vibração em milissegundos).