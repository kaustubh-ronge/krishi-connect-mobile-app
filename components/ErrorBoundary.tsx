import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

/**
 * Global crash catcher.
 *
 * Without this, any uncaught render error in a release build shows up as a
 * blank/grey screen (or a hard crash) with no message. This boundary turns
 * that into a readable, copyable error so the real cause is visible on-device.
 *
 * Note: Error boundaries only catch errors thrown during render/lifecycle of
 * descendant components. Errors in event handlers or async code are not caught
 * here (those paths already use try/catch in this codebase).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Keep the component stack so we can show where it broke.
    this.setState({ componentStack: info?.componentStack || null });
    // Still log it so it shows in adb logcat / dev console.
    console.error('[ErrorBoundary] Caught render error:', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, componentStack } = this.state;
    const message = error?.message || String(error) || 'Unknown error';
    const name = error?.name || 'Error';

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The screen hit an error while loading. The details below help pinpoint the cause.
          </Text>

          <View style={styles.errorBox}>
            <Text style={styles.errorLabel}>{name}</Text>
            <Text style={styles.errorMessage} selectable>
              {message}
            </Text>
          </View>

          {componentStack ? (
            <View style={styles.stackBox}>
              <Text style={styles.stackLabel}>Component stack</Text>
              <Text style={styles.stackText} selectable>
                {componentStack.trim()}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry} activeOpacity={0.85}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Tip: long-press the error text above to copy it.
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emoji: { fontSize: 44, textAlign: 'center', marginBottom: 12 },
  title: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginBottom: 8, letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 21, marginBottom: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  errorLabel: {
    fontSize: 11, fontWeight: '800', color: '#fca5a5',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
  },
  errorMessage: { fontSize: 14, color: '#fecaca', fontWeight: '600', lineHeight: 20 },
  stackBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 16, marginBottom: 24,
  },
  stackLabel: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  stackText: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  retryBtn: {
    backgroundColor: '#16a34a', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  hint: {
    fontSize: 12, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', marginTop: 16,
  },
});
