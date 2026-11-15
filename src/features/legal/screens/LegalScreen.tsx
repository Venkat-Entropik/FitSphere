import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import type { LegalDocument } from '../legal.content';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../legal.content';

function Paragraph({ text }: { text: string }) {
  const bullet = text.startsWith('• ');
  return (
    <AppText
      variant="bodyMd"
      color="onSurfaceVariant"
      style={{ lineHeight: 22, paddingLeft: bullet ? 8 : 0 }}
    >
      {text}
    </AppText>
  );
}

/** Plain, readable legal text. Public: reachable signed in or out, and as a web page for store listings. */
export function LegalScreen({ document }: { document: LegalDocument }) {
  const router = useRouter();
  return (
    <Screen scroll>
      <View style={{ gap: 20, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ gap: 6 }}>
          <AppText variant="headlineLgMobile" accessibilityRole="header">
            {document.title}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            Last updated {document.updated}
          </AppText>
        </View>
        <AppText variant="bodyMd" style={{ lineHeight: 22 }}>
          {document.intro}
        </AppText>
        {document.sections.map((section) => (
          <View key={section.heading} style={{ gap: 8 }}>
            <AppText variant="headlineMd" accessibilityRole="header">
              {section.heading}
            </AppText>
            {section.body.map((text) => (
              <Paragraph key={text} text={text} />
            ))}
          </View>
        ))}
        <SecondaryButton
          label="Back"
          size="md"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </View>
    </Screen>
  );
}

export const PrivacyPolicyScreen = () => <LegalScreen document={PRIVACY_POLICY} />;
export const TermsScreen = () => <LegalScreen document={TERMS_OF_SERVICE} />;
