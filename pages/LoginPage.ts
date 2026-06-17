import { Page, expect } from '@playwright/test';


export class LoginPage {
    constructor(private page: Page) {}
	
	async goto() {
		await this.page.goto(
			process.env.BASE_URL + '/authentication/login',
			{
				waitUntil: 'domcontentloaded',
				timeout: 60000
			}
		);
		await this.page
        .getByRole('textbox', { name: 'E-Mail' })
        .waitFor();
	}
	
	
	
	get emailTextbox() {
		return this.page.getByRole('textbox', { name: 'E-Mail' });
	}

	get passwordTextbox() {
		return this.page.getByRole('textbox', { name: 'Password' });
	}

	get loginButton() {
		return this.page.getByRole('button', { name: 'Login' });
	}
	
	get invalidLoginMessage() {
		return this.page.getByText(
			'Invalid Email Id or Password'
		);
	}
	
	get passwordField() {
		return this.page.locator(
			'[formcontrolname="password"]'
		);
	}

	get roleDropdown() {
		return this.page.getByRole(
			'combobox',
			{ name: 'Select Role' }
		);
	}

    async login(email: string, password: string) {

        await this.emailTextbox
            .fill(email);

        await this.passwordTextbox
            .fill(password);

        await this.loginButton
            .click();
    }

    async selectRole(role: string) {

        await this.roleDropdown.waitFor({
            state: 'visible',
            timeout: 30000
        });
		
		await this.roleDropdown.click();


        await this.page
            .getByRole('option', { name: role })
            .click();

        await this.page
            .getByRole('button', { name: 'Proceed' })
            .click();		
    }

	async getErrorMessage() {
		return this.page.locator('mat-error');
	}

	async clickLogin() {
		await this.page
			.getByRole('button', { name: 'Login' })
			.click();
	}
}