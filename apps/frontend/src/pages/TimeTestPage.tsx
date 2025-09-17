import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../utils/format';

const TimeTestPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { locale: localeParam } = useParams();
  const [params] = useSearchParams();

  const locale = useMemo(() => {
    const lang = (localeParam as string) || i18n.language || 'es';
    if (lang.startsWith('es')) return 'es-ES';
    if (lang.startsWith('en')) return 'en-US';
    return lang;
  }, [i18n.language, localeParam]);

  const iso = params.get('iso') || '2021-03-14T02:30:00.000Z'; // DST edge in some zones
  const dateOnly = params.get('dateOnly') || '2021-03-14';
  const tz = params.get('tz') || undefined;

  return (
    <div className="p-6 space-y-4">
      <div>
        <div data-testid="iso-input">{iso}</div>
        <div data-testid="iso-datetime">{formatDateTime(iso, locale, tz)}</div>
        <div data-testid="iso-date">{formatDate(iso, locale, tz)}</div>
      </div>
      <div>
        <div data-testid="dateOnly-input">{dateOnly}</div>
        <div data-testid="dateOnly-date">{formatDate(dateOnly, locale, tz)}</div>
      </div>
      <div data-testid="timezone">{tz || 'local'}</div>
      <div data-testid="locale">{locale}</div>
    </div>
  );
};

export default TimeTestPage;
