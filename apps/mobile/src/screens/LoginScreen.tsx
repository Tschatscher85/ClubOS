import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState('');
  const [ladend, setLadend] = useState(false);
  const anmelden = useAuthStore((s) => s.anmelden);

  const handleLogin = async () => {
    if (!email || !passwort) {
      setFehler('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setLadend(true);
    setFehler('');
    try {
      await anmelden(email, passwort);
    } catch {
      setFehler('E-Mail oder Passwort ist falsch.');
    } finally {
      setLadend(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.titel}>ClubOS</Text>
        <Text style={styles.untertitel}>
          Melden Sie sich mit Ihrem Vereinskonto an
        </Text>

        <View style={styles.feld}>
          <Text style={styles.label}>E-Mail-Adresse</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="vorstand@fckunchen.de"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.feld}>
          <Text style={styles.label}>Passwort</Text>
          <TextInput
            style={styles.input}
            value={passwort}
            onChangeText={setPasswort}
            placeholder="Passwort eingeben"
            secureTextEntry
          />
        </View>

        {fehler ? <Text style={styles.fehler}>{fehler}</Text> : null}

        <TouchableOpacity
          style={[styles.button, ladend && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={ladend}
        >
          {ladend ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Anmelden</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titel: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a56db',
    marginBottom: 4,
  },
  untertitel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  feld: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  fehler: {
    color: '#dc2626',
    fontSize: 13,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1a56db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
