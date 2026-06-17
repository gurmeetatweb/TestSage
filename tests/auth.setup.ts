import { test as setup } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage';
import { FlowRecorder } from '../utils/FlowRecorder';

dotenv.config();

setup('authenticate as admin', async ({ page }) => {
    //try {
        const login = new LoginPage(page);

        await login.goto();

        await login.login(
            process.env.USER_EMAIL!,
            process.env.USER_PASSWORD!
        );
        //await page.pause();

        await login.selectRole(
            process.env.USER_ROLE!
        );

        await page.waitForURL(
            /dashboard/i,
            { timeout: 30000 }
        );
        await FlowRecorder.captureScreenMetadata(
            page,
            'Dashboard'
        );
        // await FlowRecorder.recordPage(
        //     page,
        //     'authentication-flow',
        //     'Dashboard'
        // );

        await page.context().storageState({
            path: 'playwright/.auth/admin.json'
        });
   /* } catch (error) {
        await page.screenshot({
            path: 'setup-failure.png',
            fullPage: true
        });

    throw error;
    }*/
});