import { test } from '@playwright/test';
import { FlowRecorder } from '../utils/FlowRecorder';

test.use({
    storageState:
        'playwright/.auth/admin.json'
});

test('Discover Client Management Flow', async ({ page }) => {

    FlowRecorder.startFlow(
        'client-management-flow'
    );

    await page.goto(
        'https://demo-emdatapro.valogicbio.com/dashboard'
    );

    await FlowRecorder.recordPage(
        page,
        'client-management-flow',
        'Dashboard'
    );

    const dashboardMetadata = await FlowRecorder.captureScreenMetadata(
        page,
        'Dashboard'
    );
    await FlowRecorder.saveMetadata(
        dashboardMetadata,
        'Dashboard'
    );
    await page
    .getByText('admin_panel_settingsAdmin')
    .click();

    await page
        .getByRole('link', {
            name: 'Client Management'
        })
        .click();
    await page.waitForURL(
        /client-management/i,
        { timeout: 30000 }
    );
    
    await FlowRecorder.recordPage(
        page,
        'client-management-flow',
        'Client Management List'
    );

    const listMetadata = await FlowRecorder.captureScreenMetadata(
        page,
        'ClientManagementList'
    );
    await FlowRecorder.saveMetadata(
        listMetadata,
        'ClientManagementList'
    );
    console.log('--- Client Management List Metadata ---');
    console.log(
        await page
            .locator('[role="columnheader"]')
            .allTextContents()
    );

    console.log(
        await page
            .locator('[role="gridcell"]')
            .first()
            .textContent()
    );
    await page
        .getByRole('button', {
            name: /Create New/i
        })
        .click();
    await FlowRecorder.recordPage(
        page,
        'client-management-flow',
        'Client Create'
    );
    const createMetadata = await FlowRecorder.captureScreenMetadata(
        page,
        'ClientCreate'
    );
    await FlowRecorder.saveMetadata(
        createMetadata,
        'ClientCreate'
    );
});