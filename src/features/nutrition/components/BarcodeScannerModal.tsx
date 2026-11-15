import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { CustomInput } from '@/components/ui/CustomInput';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useTheme } from '@/theme';

import { isBarcode } from '../utils/food.logic';

export interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the barcode digits, from the camera or typed by hand. */
  onBarcode: (barcode: string) => void;
  /** Shown above the camera, e.g. "No product found for that barcode". */
  message?: string | null;
  busy?: boolean;
}

/**
 * Point the camera at a barcode, or type the number under it. Typing always works, so the feature
 * does not depend on camera permission or on a camera being available (for example on the web).
 */
export function BarcodeScannerModal({
  visible,
  onClose,
  onBarcode,
  message,
  busy,
}: BarcodeScannerModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [typed, setTyped] = useState('');
  const [handled, setHandled] = useState<string | null>(null);

  const submit = (code: string) => {
    if (busy) return;
    setHandled(code);
    onBarcode(code);
  };
  const typedValid = isBarcode(typed);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
          }}
        >
          <AppText variant="headlineMd" accessibilityRole="header">
            Scan barcode
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
            onPress={onClose}
            hitSlop={12}
          >
            <Icon name="close" size={24} color="onSurfaceVariant" />
          </Pressable>
        </View>

        <View
          style={{
            flex: 1,
            marginHorizontal: 20,
            borderRadius: theme.radius.md,
            overflow: 'hidden',
          }}
        >
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              // One scan at a time: a code that was just handled is ignored until the user retries.
              onBarcodeScanned={
                busy || handled
                  ? undefined
                  : (result) => {
                      if (isBarcode(result.data)) submit(result.data.trim());
                    }
              }
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 20,
              }}
            >
              <Icon name="qr_code_scanner" size={40} color="outline" />
              <AppText variant="bodyMd" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
                {permission && !permission.canAskAgain
                  ? 'Camera access is off. Turn it on in your device settings to scan, or type the number below.'
                  : 'Allow camera access to scan a barcode, or type the number below.'}
              </AppText>
              {permission?.canAskAgain !== false ? (
                <SecondaryButton
                  label="Allow camera"
                  onPress={() => void requestPermission()}
                  size="md"
                  fullWidth={false}
                />
              ) : (
                <SecondaryButton
                  label="Open settings"
                  onPress={() => void Linking.openSettings()}
                  size="md"
                  fullWidth={false}
                />
              )}
            </View>
          )}
        </View>

        <View style={{ padding: 20, paddingBottom: 20 + insets.bottom, gap: 10 }}>
          {message ? (
            <AppText variant="bodySm" color="warning" accessibilityRole="alert">
              {message}
            </AppText>
          ) : null}
          <CustomInput
            label="Or type the barcode number"
            placeholder="e.g. 3017624010701"
            keyboardType="number-pad"
            value={typed}
            onChangeText={(t) => {
              setTyped(t.replace(/\D/g, ''));
              setHandled(null);
            }}
            maxLength={14}
            error={
              typed.length > 0 && !typedValid && typed.length >= 8
                ? 'Barcodes are 8 to 14 digits'
                : undefined
            }
          />
          <PrimaryButton
            label="Look up barcode"
            onPress={() => submit(typed.trim())}
            loading={busy}
            disabled={!typedValid}
          />
          {handled && !busy ? (
            <SecondaryButton label="Scan another" onPress={() => setHandled(null)} size="md" />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
