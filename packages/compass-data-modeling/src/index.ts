import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { WorkspacePlugin } from '@mongodb-js/compass-workspaces';
import DataModelingComponent from './components/data-modeling';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import { dataModelStorageServiceLocator } from './provider';
import { activateDataModelingStore } from './store';
import { PluginTabTitleComponent, WorkspaceName } from './plugin-tab-title';

export const WorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: registerHadronPlugin(
    {
      name: 'DataModeling',
      component: function DataModelingProvider({ children }) {
        return React.createElement(React.Fragment, null, children);
      },
      activate: activateDataModelingStore,
    },
    {
      preferences: preferencesLocator,
      connections: connectionsLocator,
      instanceManager: mongoDBInstancesManagerLocator,
      dataModelStorage: dataModelStorageServiceLocator,
      track: telemetryLocator,
      logger: createLoggerLocator('COMPASS-DATA-MODELING'),
    }
  ),
  content: DataModelingComponent,
  header: PluginTabTitleComponent,
};
