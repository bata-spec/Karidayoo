import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <select
      aria-label={t('language.label')}
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
