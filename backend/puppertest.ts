import puppeteer from 'puppeteer';

(async () => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();

	// 対象のページにアクセス
	await page.goto('https://stg-www.sandbox.paypay.ne.jp/app/webcashier?code=https%3A%2F%2Fqr-stg.sandbox.paypay.ne.jp%2F28180104xAx0V4FA38wPcMaN&pid=QRCode&link_key=https%3A%2F%2Fqr-stg.sandbox.paypay.ne.jp%2F28180104xAx0V4FA38wPcMaN&af_force_deeplink=true', {
		waitUntil: 'networkidle0',
	});

	// iframe を取得
	const iframeElement = await page.waitForSelector('iframe');
	const frame = await iframeElement?.contentFrame();
	if (!frame) {
		console.error('iframe が見つかりませんでした。');
		await browser.close();
		return;
	}
	// 電話番号を入力
	const phoneSelector = 'input[type="tel"][placeholder="登録済みの携帯電話番号"]';
	await frame.waitForSelector(phoneSelector, { visible: true });
	await frame.type(phoneSelector, '09012345678');

	// パスワードを入力
	const passwordSelector = 'input[type="password"][placeholder="パスワード"]';
	await frame.waitForSelector(passwordSelector, { visible: true });
	await frame.type(passwordSelector, 'password123');

	// 「同意してログイン」ボタンをクリック
	const loginButtonSelector = 'button[class*="submit-button"]'; // より汎用的に書くと壊れにくくなります
	await frame.waitForSelector(loginButtonSelector, { visible: true });
	await frame.click(loginButtonSelector);

	// スクリーンショット（ログイン後の確認用）
	await page.screenshot({ path: 'after_login_click.png' });

	await browser.close();
})();