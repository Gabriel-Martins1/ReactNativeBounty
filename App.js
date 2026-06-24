import { useState, useEffect } from 'react';
import { Appearance, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [tema, setTema] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const assinatura = Appearance.addChangeListener(({ colorScheme }) => {
      setTema(colorScheme);
    });

    return () => assinatura.remove();
  }, []);

  const ehTemaEscuro = tema === 'dark';

  return (
    <View style={[styles.container, ehTemaEscuro ? styles.fundoEscuro : styles.fundoClaro]}>
      <Text style={ehTemaEscuro ? styles.textoClaro : styles.textoEscuro}>
        Check-in de Estudos
      </Text>
      <Text style={ehTemaEscuro ? styles.textoClaro : styles.textoEscuro}>
        Tema do sistema: {ehTemaEscuro ? 'Escuro' : 'Claro'}
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