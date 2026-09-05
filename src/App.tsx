import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate } from 'react-router-dom';
import { rtlLanguages } from './i18n';
import HomePage from './pages/HomePage';
import DashboardLayout from './pages/DashboardLayout';
import EntryListPage from './pages/EntryListPage';
import EntryViewPage from './pages/EntryViewPage';
import EntryEditPage from './pages/EntryEditPage';
import GraphPage from './pages/GraphPage';
import TemplatesPage from './pages/TemplatesPage';
import PlotListPage from './pages/PlotListPage';
import PlotEditPage from './pages/PlotEditPage';
import TimelineListPage from './pages/TimelineListPage';
import TimelineEditPage from './pages/TimelineEditPage';
import ManuscriptListPage from './pages/ManuscriptListPage';
import ManuscriptEditPage from './pages/ManuscriptEditPage';

export default function App() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = rtlLanguages.has(i18n.language) ? 'rtl' : 'ltr';
    document.title = t('app.name');
  }, [i18n.language, t]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/works/:workId" element={<DashboardLayout />}>
        <Route index element={<Navigate to="entries" replace />} />
        <Route path="entries" element={<EntryListPage />} />
        <Route path="entries/new" element={<EntryEditPage />} />
        <Route path="entries/:entryId" element={<EntryViewPage />} />
        <Route path="entries/:entryId/edit" element={<EntryEditPage />} />
        <Route path="graph" element={<GraphPage />} />
        <Route path="graph/:entryId" element={<GraphPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="plots" element={<PlotListPage />} />
        <Route path="plots/:plotId" element={<PlotEditPage />} />
        <Route path="timelines" element={<TimelineListPage />} />
        <Route path="timelines/:timelineId" element={<TimelineEditPage />} />
        <Route path="manuscript" element={<ManuscriptListPage />} />
        <Route path="manuscript/:chapterId" element={<ManuscriptEditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
