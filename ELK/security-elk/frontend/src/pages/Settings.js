import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

const Settings = () => {
  const { t } = useLocalization();

  return (
    <div>
      <h2>{t('settings.title')}</h2>
      <div className="card">{t('settings.description')}</div>
    </div>
  );
};

export default Settings;
