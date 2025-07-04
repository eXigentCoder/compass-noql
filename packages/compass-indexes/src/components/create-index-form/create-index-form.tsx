import React, { useMemo } from 'react';
import {
  css,
  spacing,
  Accordion,
  Body,
  RadioBoxGroup,
  RadioBox,
} from '@mongodb-js/compass-components';
import type { Field, Tab } from '../../modules/create-index';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { CreateIndexFields } from '../create-index-fields';
import { hasColumnstoreIndexesSupport } from '../../utils/columnstore-indexes';
import CheckboxInput from './checkbox-input';
import CollapsibleInput from './collapsible-input';
import {
  useConnectionInfo,
  useConnectionSupports,
} from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';
import IndexFlowSection from './index-flow-section';
import QueryFlowSection from './query-flow-section';
import toNS from 'mongodb-ns';
import type { Document } from 'mongodb';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const createIndexModalFieldsStyles = css({
  margin: `${spacing[600]}px 0 ${spacing[800]}px 0`,
});

const indexFieldsHeaderStyles = css({
  marginBottom: spacing[100],
});

const createIndexModalOptionStyles = css({
  paddingLeft: spacing[100] + 2,
});

const createIndexModalFlowsStyles = css({
  marginBottom: spacing[600],
});

export type CreateIndexFormProps = {
  namespace: string;
  fields: Field[];
  serverVersion: string;
  currentTab: Tab;
  onSelectFieldNameClick: (idx: number, name: string) => void;
  onSelectFieldTypeClick: (idx: number, fType: string) => void;
  onAddFieldClick: () => void; // Plus icon.
  onRemoveFieldClick: (idx: number) => void; // Minus icon.
  onTabClick: (tab: Tab) => void;
  showIndexesGuidanceVariant?: boolean;
  query: Document | null;
};

function CreateIndexForm({
  namespace,
  fields,
  serverVersion,
  currentTab,
  onSelectFieldNameClick,
  onSelectFieldTypeClick,
  onAddFieldClick,
  onRemoveFieldClick,
  onTabClick,
  showIndexesGuidanceVariant,
  query,
}: CreateIndexFormProps) {
  const { id: connectionId } = useConnectionInfo();
  const rollingIndexesFeatureEnabled = !!usePreference('enableRollingIndexes');
  const supportsRollingIndexes = useConnectionSupports(
    connectionId,
    'rollingIndexCreation'
  );
  const showRollingIndexOption =
    rollingIndexesFeatureEnabled && supportsRollingIndexes;

  const track = useTelemetry();

  const schemaFields = useAutocompleteFields(namespace);
  const schemaFieldNames = useMemo(() => {
    return schemaFields
      .filter((field) => {
        return field.name !== '_id';
      })
      .map((field) => {
        return field.name;
      });
  }, [schemaFields]);

  const showIndexesGuidanceIndexFlow =
    showIndexesGuidanceVariant && currentTab === 'IndexFlow';
  const showIndexesGuidanceQueryFlow =
    showIndexesGuidanceVariant && currentTab === 'QueryFlow';
  const [inputQuery, setInputQuery] = React.useState(
    query ? JSON.stringify(query, null, 2) : ''
  );

  const { database: dbName, collection: collectionName } = toNS(namespace);

  return (
    <>
      <div
        className={createIndexModalFieldsStyles}
        data-testid="create-index-form"
      >
        {!showIndexesGuidanceVariant ? (
          <Body weight="medium" className={indexFieldsHeaderStyles}>
            Index fields
          </Body>
        ) : (
          <RadioBoxGroup
            aria-labelledby="index-flows"
            data-testid="create-index-form-flows"
            id="create-index-form-flows"
            onChange={(e) => {
              const tabName =
                e.target.value === 'IndexFlow'
                  ? 'Start with an Index'
                  : 'Start with a Query';
              track(`${tabName} Tab Clicked`, {
                context: 'Create Index Modal',
              });
              onTabClick(e.target.value as Tab);
            }}
            value={currentTab}
            className={createIndexModalFlowsStyles}
          >
            <RadioBox id="index-flow" value={'IndexFlow'}>
              Start with an Index
            </RadioBox>
            <RadioBox id="query-flow" value={'QueryFlow'}>
              Start with a Query
            </RadioBox>
          </RadioBoxGroup>
        )}

        {fields.length > 0 ? (
          // Variant UI
          showIndexesGuidanceVariant && showIndexesGuidanceIndexFlow ? (
            <IndexFlowSection
              fields={fields}
              dbName={dbName}
              collectionName={collectionName}
              createIndexFieldsComponent={
                <CreateIndexFields
                  schemaFields={schemaFieldNames}
                  fields={fields}
                  serverVersion={serverVersion}
                  isRemovable={!(fields.length > 1)}
                  onSelectFieldNameClick={onSelectFieldNameClick}
                  onSelectFieldTypeClick={onSelectFieldTypeClick}
                  onAddFieldClick={onAddFieldClick}
                  onRemoveFieldClick={onRemoveFieldClick}
                />
              }
            />
          ) : (
            // Control UI
            !showIndexesGuidanceQueryFlow && (
              <CreateIndexFields
                schemaFields={schemaFieldNames}
                fields={fields}
                serverVersion={serverVersion}
                isRemovable={!(fields.length > 1)}
                onSelectFieldNameClick={onSelectFieldNameClick}
                onSelectFieldTypeClick={onSelectFieldTypeClick}
                onAddFieldClick={onAddFieldClick}
                onRemoveFieldClick={onRemoveFieldClick}
              />
            )
          )
        ) : null}
      </div>

      {showIndexesGuidanceQueryFlow && (
        <QueryFlowSection
          schemaFields={schemaFields}
          serverVersion={serverVersion}
          dbName={dbName}
          collectionName={collectionName}
          initialQuery={query}
          inputQuery={inputQuery}
          setInputQuery={setInputQuery}
        />
      )}

      <Accordion
        data-testid="create-index-modal-toggle-options"
        text={showIndexesGuidanceVariant ? 'Index Options' : 'Options'}
        setOpen={() => {
          track('Options Clicked', {
            context: 'Create Index Modal',
          });
        }}
      >
        <div
          data-testid="create-index-modal-options"
          className={createIndexModalOptionStyles}
        >
          <CheckboxInput name="unique"></CheckboxInput>
          <CollapsibleInput name="name"></CollapsibleInput>
          <CollapsibleInput name="expireAfterSeconds"></CollapsibleInput>
          <CollapsibleInput name="partialFilterExpression"></CollapsibleInput>
          <CollapsibleInput name="wildcardProjection"></CollapsibleInput>
          <CollapsibleInput name="collation"></CollapsibleInput>
          {hasColumnstoreIndexesSupport(serverVersion) && (
            <CollapsibleInput name="columnstoreProjection"></CollapsibleInput>
          )}
          <CheckboxInput name="sparse"></CheckboxInput>
          {showRollingIndexOption && (
            <CheckboxInput name="buildInRollingProcess"></CheckboxInput>
          )}
        </div>
      </Accordion>
    </>
  );
}

export { CreateIndexForm };
