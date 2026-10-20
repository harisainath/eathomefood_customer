import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { CommonActions } from '@react-navigation/native';
import { useAppConfig } from '../AppConfigContext';
import { colors } from '../theme';
import { Button, EmptyState, Loader } from '../components/ui';

/** Terms & Conditions page from the server (terms_url setting), shown in a WebView. */
export default function TermsScreen({ route, navigation }) {
  const { config, refresh } = useAppConfig();
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const showAgree = !!route.params?.showAgree;

  if (!config.terms_url) {
    return <EmptyState emoji="📄" title="Loading terms" subtitle="Connecting to the server…"
      action={<Button title="Try again" variant="outline" onPress={refresh} />} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {failed ? (
        <EmptyState emoji="📡" title="Couldn't load the terms" subtitle="Check your internet connection and try again."
          action={<Button title="Try again" variant="outline" onPress={() => { setFailed(false); setReloadKey((k) => k + 1); }} />} />
      ) : (
        <WebView
          key={reloadKey}
          source={{ uri: config.terms_url }}
          startInLoadingState
          renderLoading={() => <View style={StyleSheet.absoluteFill}><Loader /></View>}
          onError={() => setFailed(true)}
          onHttpError={() => setFailed(true)}
        />
      )}
      {showAgree && (
        <SafeAreaView edges={['bottom']} style={s.footer}>
          <Button title="I agree" onPress={() => agreeAndGoBack(navigation)} />
        </SafeAreaView>
      )}
    </View>
  );
}

/** Tick the checkbox on the previous (sign-up) screen and return to it. */
function agreeAndGoBack(navigation) {
  const { routes, index } = navigation.getState();
  const previous = routes[index - 1];
  if (previous) navigation.dispatch({ ...CommonActions.setParams({ termsAccepted: true }), source: previous.key });
  navigation.goBack();
}

const s = StyleSheet.create({
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#fff' },
});
