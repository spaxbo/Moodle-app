import {test, expect} from '@playwright/test';

test.describe('Login', () =>{
    test.beforeEach(async ({page}) => {
        await page.goto('/');
    });

    test('should display login form', async ({ page }) => {
        await expect(page).toHaveTitle('Moodle');
        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
      });

    test('successful admin login', async ({page}) => {
        await page.fill('#email', 'admin@gmail.com');
        await page.fill('#password', 'secureadminpassword');

        const [response] = await Promise.all([
            page.waitForResponse(res => 
                res.url().includes('/login') && res.status() === 200
            ),
            page.click('button[type="submit"]')
        ])

        await page.waitForURL(/\/admin/);
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
    });

    test('successful teacher login', async ({page}) => {
        await page.fill('#email', 'viorelciomag@gmail.com');
        await page.fill('#password', 'viorelciomag');

        const [response] = await Promise.all([
            page.waitForResponse(res => 
                res.url().includes('/login') && res.status() === 200
            ),
            page.click('button[type="submit"]')
        ])

        await page.waitForURL(/\/teacher/);
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
    });

    test('successful student login', async ({page}) => {
        await page.fill('#email', 'andreiverde@gmail.com');
        await page.fill('#password', 'andreiverde');

        const [response] = await Promise.all([
            page.waitForResponse(res => 
                res.url().includes('/login') && res.status() === 200
            ),
            page.click('button[type="submit"]')
        ])

        await page.waitForURL(/\/student/);
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
    });

    test('invalid credentials', async ({page}) => {
        await page.fill('#email', 'invalid@gmail.com');
        await page.fill('#password', 'invalid');
        await page.click('button[type="submit"]');

        await expect(page.locator('.text-red-500')).toContainText('Invalid email or password');
    });

    test('server error handling', async ({page}) => {
        await page.route('http://localhost:8080/login', route => route.abort());
        await page.fill('#email', 'test@test.com');
        await page.fill('#password', 'parola');
        await page.click('button[type="submit"]');
        await expect(page.locator('.text-red-500')).toContainText('Unable to connect to the server');
    });

    test('loading state during login', async ({page}) => {
        await page.fill('#email', 'admin@gmail.com');
        await page.fill('#password', 'secureadminpassword');

        const button = page.locator('button[type="submit"]');
        await expect(button).toBeEnabled();

        const clickPromise = button.click();
        await expect(button).toContainText('Logging in...');

        await clickPromise;
    })
})