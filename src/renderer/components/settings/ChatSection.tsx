import React from 'react';
import { FormControlLabel, FormGroup, Switch } from '@mui/material';
import SectionCard from './SectionCard';
import { useTranslation } from 'react-i18next';

type Props = {
  showGeneralChatNotifications: string;
  setShowGeneralChatNotifications: (v: string) => void;
  disableAllNotifications: string;
  setDisableAllNotifications: (v: string) => void;
};

export default function ChatSection({
  showGeneralChatNotifications,
  setShowGeneralChatNotifications,
  disableAllNotifications,
  setDisableAllNotifications,
}: Props) {
  const { t } = useTranslation();

  return (
    <SectionCard title={t('settings.chatTab', 'Chat')}>
      <FormGroup>
        <FormControlLabel
          control={<Switch />}
          label={t(
            'settings.generalNotificationsLabel',
            'Recieve notifications for general chat',
          )}
          checked={showGeneralChatNotifications === 'true'}
          onChange={() =>
            setShowGeneralChatNotifications(
              showGeneralChatNotifications === 'true' ? 'false' : 'true',
            )
          }
        />
        <FormControlLabel
          control={<Switch />}
          label={t(
            'settings.disableAllNotificationsLabel',
            'Disable all chat notifications',
          )}
          checked={disableAllNotifications === 'true'}
          onChange={() =>
            setDisableAllNotifications(
              disableAllNotifications === 'true' ? 'false' : 'true',
            )
          }
        />
      </FormGroup>
    </SectionCard>
  );
}
