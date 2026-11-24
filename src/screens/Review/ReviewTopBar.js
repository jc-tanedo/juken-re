import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { Entypo, AntDesign, Feather } from '@expo/vector-icons'; 
import { useActionSheet } from '@expo/react-native-action-sheet';
import useNetworkListener from 'src/hooks/useNetworkListener';
import TopBar from 'src/components/TopBar/TopBar';

import Badge from 'src/components/Badge/Badge';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';
import dialog from 'src/utils/dialog';

const ReviewTopBar = ({
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
  if (uploadSuccess) badgeIcon = <AntDesign name="check" size={13} color={badgeForeground} />;
  if (uploadQueue > 0) badgeIcon = <AntDesign name="arrow-up" size={13} color={badgeForeground} />;

  let badgeText = null;
  if (uploadQueue > 0) badgeText = uploadQueue;
  if (uploadFail) badgeText = uploadErrors;

  return (
    <>

      {/** top bar */}
      <TopBar
        style={styles.wrapper}
        centerText="Reviews"
        leftLabel="Review settings"
        rightLabel={uploadFail ? "Resolve submission errors" : undefined}
        textStyle={{ color: colors.onSurface }}
        left={<Entypo name="menu" size={26} color={colors.onSurface} />}
        leftOnPress={() => setMenuOpen(true)}
        right={
          <>
            {!isInternetReachable && (
              <Badge
                style={{ marginRight: 6, backgroundColor: colors.errorContainer }}
                icon={<Feather name="wifi-off" size={13} color={colors.onErrorContainer} />}
              />
            )}
            <Badge
              style={{ backgroundColor: badgeColor }}
              text={badgeText}
              textColor={badgeForeground}
              icon={badgeIcon}
            />
          </>
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
                  onConfirm: ignoreSubmissionErrors
                });
              }
            })
        }}
      />
    </>
  )
};

ReviewTopBar.propTypes = {
  submissionQueue: PropTypes.array,
  submissionErrors: PropTypes.array,
  ignoreSubmissionErrors: PropTypes.func,
  retrySubmission: PropTypes.func,
  setMenuOpen: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12
  }
})

export default ReviewTopBar;
