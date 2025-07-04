import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createNestedDocumentsCollection,
  createNumbersCollection,
} from '../helpers/insert-data';

type DiagramInstance = {
  getNodes: () => Array<{
    id: string;
  }>;
};

async function getDiagramNodes(browser: CompassBrowser): Promise<string[]> {
  const nodes = await browser.execute(function (selector) {
    const node = document.querySelector(selector);
    if (!node) {
      throw new Error(`Element with selector ${selector} not found`);
    }
    return (
      node as Element & { _diagram: DiagramInstance }
    )._diagram.getNodes();
  }, Selectors.DataModelEditor);
  return nodes.map((x) => x.id);
}

describe('Data Modeling tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'data modeling not yet available in compass-web');

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('enableDataModeling', true);
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNestedDocumentsCollection('testCollection1');
    await createNumbersCollection('testCollection2');
    await browser.disconnectAll();
    await browser.connectToDefaults();
  });

  after(async function () {
    if (compass) {
      await cleanup(compass);
    }
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('creates a new data model using an existing connection', async function () {
    await browser.navigateToDataModeling();

    // Click on create new data model button
    await browser.clickVisible(Selectors.CreateNewDataModelButton);

    // Fill in model details
    const dataModelName = 'Test Data Model';
    await browser.setValueVisible(
      Selectors.CreateDataModelNameInput,
      dataModelName
    );
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // Select existing connection
    await browser.selectOption(
      Selectors.CreateDataModelConnectionSelector,
      DEFAULT_CONNECTION_NAME_1
    );
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // Select a database
    await browser.selectOption(
      Selectors.CreateDataModelDatabaseSelector,
      'test'
    );
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // TODO: Confirm all collections are selected by default (COMPASS-9309)
    // Note: We'll need to change the UI, right now the labels are disconnected from the checkboxes
    await browser.clickVisible(Selectors.CreateDataModelConfirmButton);

    // Wait for the diagram editor to load
    const dataModelEditor = browser.$(Selectors.DataModelEditor);
    await dataModelEditor.waitForDisplayed();

    let nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(2);
    expect(nodes).to.deep.equal([
      'test.testCollection1',
      'test.testCollection2',
    ]);

    // Apply change to the model
    const newModel = {
      type: 'SetModel',
      model: {
        collections: [],
        relationships: [],
      },
    };
    await browser.setCodemirrorEditorValue(
      Selectors.DataModelApplyEditor,
      JSON.stringify(newModel)
    );
    await browser.clickVisible(Selectors.DataModelEditorApplyButton);
    await browser.waitForAnimations(dataModelEditor);

    // Verify that the model is updated
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(0);

    // Undo the change
    await browser.clickVisible(Selectors.DataModelUndoButton);
    await browser.waitForAnimations(dataModelEditor);
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(2);
    expect(nodes).to.deep.equal([
      'test.testCollection1',
      'test.testCollection2',
    ]);

    // Redo the change
    await browser.waitForAriaDisabled(Selectors.DataModelRedoButton, false);
    await browser.clickVisible(Selectors.DataModelRedoButton);
    await browser.waitForAnimations(dataModelEditor);
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(0);

    // Open a new tab
    await browser.openNewTab();

    // Open the saved diagram
    await browser.clickVisible(Selectors.DataModelsListItem(dataModelName));
    await browser.$(Selectors.DataModelEditor).waitForDisplayed();

    // Verify that the diagram has the latest changes
    nodes = await getDiagramNodes(browser);
    expect(nodes).to.have.lengthOf(0);

    // Open a new tab
    await browser.openNewTab();

    // Delete the saved diagram
    await browser.clickVisible(
      Selectors.DataModelsListItemActions(dataModelName)
    );
    await browser.clickVisible(Selectors.DataModelsListItemDeleteButton);
    await browser.clickVisible(Selectors.confirmationModalConfirmButton());
    await browser
      .$(Selectors.DataModelsListItem(dataModelName))
      .waitForDisplayed({ reverse: true });
  });
});
