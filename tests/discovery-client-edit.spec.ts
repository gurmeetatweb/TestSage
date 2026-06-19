//import { test } from '@playwright/test';
import { FlowRecorder } from '../utils/FlowRecorder';
import { test, expect } from '@playwright/test';

test.use({
    storageState:
        'playwright/.auth/admin.json'
});

test('Discover Client Management Flow', async ({ page }) => {

    FlowRecorder.startFlow(
        'client-edit-flow'
    );

    await page.goto(
        'https://demo-emdatapro.valogicbio.com/dashboard'
    );

    await FlowRecorder.recordPage(
        page,
        'client-edit-flow',
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
        'client-edit-flow',
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
        .locator('button')
        .filter({ hasText: '✎' })
        .first()
        .click();
    await expect(
        page.getByText(
            'Client Name'
        )
    ).toBeVisible();
    
    await FlowRecorder
            .recordPage(
                page,
                'client-edit-flow',
                'Client Edit'
            );

    const metadata  = await FlowRecorder.captureScreenMetadata(
        page,
        'ClientEdit'
    );
    await FlowRecorder.saveMetadata(
        metadata,
        'ClientEdit'
    );
    console.log(
        JSON.stringify(
            metadata,
            null,
            2
        )
    );
});