import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage';
import { FlowRecorder } from '../utils/FlowRecorder';

dotenv.config();

test.describe('Login Module', () => {

    test('UC Login#1 Successful Login', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await login.login(
            process.env.USER_EMAIL!,
            process.env.USER_PASSWORD!
        );
        
        await FlowRecorder.recordPage(
            page,
            'login-usecase-flow',
            'Login'
        );

        await login.selectRole(
            process.env.USER_ROLE!
        );

        await page.waitForURL(
            /dashboard/i,
            { timeout: 30000 }
        );

        await FlowRecorder.recordPage(
            page,
            'login-usecase-flow',
            'Dashboard'
        );

        await expect(page).not.toHaveURL(
            /authentication\/login/
        );
    });

    test('UC Login#2 Invalid Password', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await login.login(
            process.env.USER_EMAIL!,
            'WrongPassword123'
        );

        await expect(
            page.getByText('Invalid Email Id or Password')
        ).toBeVisible();
    });

    test('UC Login#3 Invalid Email', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await login.login(
            'invalid@email.com',
            process.env.USER_PASSWORD!
        );

        await expect(
            page.getByText('Invalid Email Id or Password')
        ).toBeVisible();
    });

    test('UC Login#4 Invalid Email + Password', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await login.login(
            'invalid@email.com',
            'WrongPassword123'
        );

        await expect(
            page.getByText('Invalid Email Id or Password')
        ).toBeVisible();
    });

    test('UC Login#5 Password Masked By Default', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        const passwordField =
            page.getByRole('textbox', { name: 'Password' });

//        await expect(passwordField)
//            .toHaveAttribute('type', 'password');
		await expect(
			login.passwordField
		).toHaveAttribute('type', 'password');
    });

    test('UC Login#6 Empty Email', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await page
            .getByRole('textbox', { name: 'Password' })
            .fill(process.env.USER_PASSWORD!);

        await login.clickLogin();

        await expect(
            page.getByRole('textbox', { name: 'E-Mail' })
        ).toBeVisible();
    });

    test('UC Login#7 Empty Password', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await page
            .getByRole('textbox', { name: 'E-Mail' })
            .fill(process.env.USER_EMAIL!);

        await login.clickLogin();

        await expect(
            page.getByRole('textbox', { name: 'Password' })
        ).toBeVisible();
    });

    test('UC Login#8 Empty Email And Password', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await login.clickLogin();

        await expect(
            page.getByRole('textbox', { name: 'E-Mail' })
        ).toBeVisible();

        await expect(
            page.getByRole('textbox', { name: 'Password' })
        ).toBeVisible();
    });

    test('UC Login#10 Role Selection', async ({ page }) => {

        const login = new LoginPage(page);

        await login.goto();

        await login.login(
            process.env.USER_EMAIL!,
            process.env.USER_PASSWORD!
        );

        await expect(
            page.getByRole('combobox', {
                name: 'Select Role'
            })
        ).toBeVisible();
    });

});