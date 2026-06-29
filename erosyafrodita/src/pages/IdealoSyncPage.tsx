import React from 'react';
import { IdealoSync } from '../components/IdealoSync';
import AdminLayout from '../components/AdminLayout';

const IdealoSyncPage: React.FC = () => {
  return (
    <AdminLayout>
      <IdealoSync />
    </AdminLayout>
  );
};

export default IdealoSyncPage;
