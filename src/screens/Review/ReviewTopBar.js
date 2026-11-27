import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import useNetworkListener from 'src/hooks/useNetworkListener';
import TopBar from 'src/components/TopBar/TopBar';
import Badge from 'src/components/Badge/Badge';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';
import dialog from 'src/utils/dialog';

const ReviewTopBar = ({
  demo = false,
  wrapUpMode = false,
  submissionQueue,
  submissionErrors,
  ignoreSubmissionErrors,
  retrySubmission,
  setMenuOpen,
}) => {
  const isInternetReachable = useNetworkListener();
  const { showActionSheetWithOptions } = useActionSheet();

  const uploadSuccess = submissionQueue.length === 0;
  const uploadFail = submissionErrors.length > 0;
  const uploadQueue = submissionQueue.length;
  const uploadErrors = submissionErrors.length;

  const colors = theme[useColorScheme()];
  const badgeColor = uploadFail ? colors.errorContainer : colors.primaryContainer;
  const badgeForeground = uploadFail ? colors.onErrorContainer : colors.onPrimaryContainer;

  let badgeIcon = null;
  if (uploadSuccess && !uploadFail) {
    badgeIcon = <MaterialIcons name="check" size={16} color={badgeForeground} />;
  } else if (uploadFail) {
    badgeIcon = <MaterialIcons name="error-outline" size={16} color={badgeForeground} />;
  } else if (uploadQueue > 0) {
    badgeIcon = <MaterialIcons name="cloud-upload" size={16} color={badgeForeground} />;
  }

  let badgeText = null;
  if (uploadQueue > 0) badgeText = uploadQueue;
  if (uploadFail) badgeText = uploadErrors;

  const modePill = wrapUpMode
    ? { label: 'Wrap-up', bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer }
    : demo
      ? { label: 'Demo', bg: colors.secondaryContainer, fg: colors.onSecondaryContainer }
      : null;

  return (
    <TopBar
      style={styles.wrapper}
      centerText={modePill ? undefined : 'Reviews'}
      center={modePill ? (
        <View style={styles.centerRow}>
          <Text accessibilityRole="header" style={[theme.type.titleLarge, { color: colors.onSurface }]}>
            Reviews
          </Text>
          <View style={[styles.modeChip, { backgroundColor: modePill.bg }]}>
            <Text style={[theme.type.labelSmall, { color: modePill.fg }]}>{modePill.label}</Text>
          </View>
        </View>
      ) : undefined}
      leftLabel="Review settings"
      rightLabel={uploadFail ? 'Resolve submission errors' : undefined}
      textStyle={{ color: colors.onSurface }}
      left={(
        <View style={[styles.menuButton, { backgroundColor: colors.surfaceContainerHigh }]}>
          <MaterialIcons name="menu" size={22} color={colors.onSurface} />
        </View>
      )}
      leftOnPress={() => setMenuOpen(true)}
      right={
        <View style={styles.badges}>
          {!isInternetReachable && (
            <Badge
              style={{ backgroundColor: colors.errorContainer }}
              icon={<MaterialIcons name="cloud-off" size={16} color={colors.onErrorContainer} />}
            />
          )}
          <Badge
            style={{ backgroundColor: badgeColor }}
            text={badgeText}
            textColor={badgeForeground}
            icon={badgeIcon}
          />
        </View>
      }
      rightOnPress={!uploadFail ? null : () => {
        showActionSheetWithOptions({
          options: [
            'Cancel',
            'Retry',
            'Ignore',
          ],
          destructiveButtonIndex: 2,
          title: `Failed to submit ${uploadErrors} review${uploadErrors === 1 ? '' : 's'}`,
          message: (
            'You can retry submission after making sure your device ' +
            'has an active internet connection. If you submitted the reviews ' +
            'from another application, please use the Ignore button to dismiss ' +
            'the errors.'
          ),
        }, buttonIndex => {
          if (buttonIndex === 1) {
            retrySubmission();
          } else if (buttonIndex === 2) {
            dialog({
              webTitle: 'Unless you submitted your reviews elsewhere, your unsubmitted reviews will be lost. Are you sure ?',
              mobileTitle: 'Are you sure ?',
              mobileMessage: 'Unless you submitted your reviews elsewhere, your unsubmitted reviews will be lost.',
              onConfirm: ignoreSubmissionErrors,
            });
          }
        });
      }}
    />
  );
};

ReviewTopBar.propTypes = {
  demo: PropTypes.bool,
  wrapUpMode: PropTypes.bool,
  submissionQueue: PropTypes.array,
  submissionErrors: PropTypes.array,
  ignoreSubmissionErrors: PropTypes.func,
  retrySubmission: PropTypes.func,
  setMenuOpen: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.shape.full,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default ReviewTopBar;
