import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { chromium } from 'playwright';
import { MAX_IMAGE_SIZE_BYTES } from '../constants/imageUpload.js';
import { ensureTempUploadDirectory } from './tempFile.service.js';

const CAPTURE_TIMEOUT_MS = 25000;
const NETWORK_IDLE_TIMEOUT_MS = 5000;
const BLOCKED_HOSTNAMES = new Set(['localhost']);

class WebsiteCaptureError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'WebsiteCaptureError';
    this.statusCode = statusCode;
  }
}

const isPrivateIpv4 = (address) => {
  const parts = address.split('.').map(Number);
  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168 ||
    first === 100 && second >= 64 && second <= 127
  );
};

const isPrivateIpv6 = (address) => {
  const normalized = address.toLowerCase();

  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
};

const isPrivateAddress = (address) => {
  const version = net.isIP(address);

  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
};

const normalizeWebsiteUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new WebsiteCaptureError('Enter a valid website URL.');
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl.trim());
  } catch {
    throw new WebsiteCaptureError('Enter a valid website URL, including https://.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new WebsiteCaptureError('Only http and https website URLs are supported.');
  }

  if (BLOCKED_HOSTNAMES.has(parsedUrl.hostname.toLowerCase())) {
    throw new WebsiteCaptureError('Local or private network URLs cannot be analyzed.');
  }

  return parsedUrl;
};

const assertPublicHostname = async (hostname) => {
  const normalizedHostname = hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(normalizedHostname)) {
    throw new WebsiteCaptureError('Local or private network URLs cannot be analyzed.');
  }

  if (net.isIP(normalizedHostname)) {
    if (isPrivateAddress(normalizedHostname)) {
      throw new WebsiteCaptureError('Local or private network URLs cannot be analyzed.');
    }
    return;
  }

  let records;

  try {
    records = await dns.lookup(normalizedHostname, { all: true });
  } catch {
    throw new WebsiteCaptureError('We could not resolve that website URL.', 422);
  }

  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new WebsiteCaptureError('Local or private network URLs cannot be analyzed.');
  }
};

const getFriendlyBrowserError = (error) => {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('timeout')) {
    return new WebsiteCaptureError('The website took too long to load. Try again or use a screenshot.', 504);
  }

  if (
    message.includes('err_cert') ||
    message.includes('ssl') ||
    message.includes('certificate')
  ) {
    return new WebsiteCaptureError('The website SSL certificate could not be verified.', 422);
  }

  if (
    message.includes('err_name_not_resolved') ||
    message.includes('err_internet_disconnected') ||
    message.includes('err_connection') ||
    message.includes('err_address')
  ) {
    return new WebsiteCaptureError('We could not open that website. Check the URL and try again.', 422);
  }

  return new WebsiteCaptureError('The website could not be captured. Try a screenshot instead.', 422);
};

const assertUsableResponse = (response) => {
  if (!response) {
    throw new WebsiteCaptureError('The website did not return a usable page.', 422);
  }

  const status = response.status();

  if (status === 404) {
    throw new WebsiteCaptureError('We could not analyze this URL because the page returned 404.', 404);
  }

  if (status === 401) {
    throw new WebsiteCaptureError('This page appears to require login before it can be analyzed.', 401);
  }

  if (status === 403) {
    throw new WebsiteCaptureError('This website blocked automated access. Try uploading a screenshot.', 403);
  }

  if (status >= 400) {
    throw new WebsiteCaptureError(`The website returned HTTP ${status}. Try another URL or upload a screenshot.`, 422);
  }
};

const appearsLoginRequired = async (page) => {
  const passwordFields = await page.locator('input[type="password"]').count();
  if (passwordFields > 0) return true;

  const currentUrl = page.url().toLowerCase();
  const title = (await page.title().catch(() => '')).toLowerCase();

  return [currentUrl, title].some((value) =>
    ['login', 'log-in', 'signin', 'sign-in', 'auth'].some((token) => value.includes(token)));
};

const createCapturedFile = async (screenshotPath, url) => {
  const stats = await fs.stat(screenshotPath);

  if (stats.size > MAX_IMAGE_SIZE_BYTES) {
    throw new WebsiteCaptureError('The captured screenshot is too large. Try uploading a screenshot instead.', 413);
  }

  return {
    fieldname: 'image',
    originalname: `${new URL(url).hostname}.jpg`,
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: path.dirname(screenshotPath),
    filename: path.basename(screenshotPath),
    path: screenshotPath,
    size: stats.size,
  };
};

export const captureWebsiteScreenshot = async (rawUrl) => {
  const targetUrl = normalizeWebsiteUrl(rawUrl);
  await assertPublicHostname(targetUrl.hostname);

  const tempDirectory = await ensureTempUploadDirectory();
  const screenshotPath = path.join(tempDirectory, `${crypto.randomUUID()}.jpg`);
  const hostnameChecks = new Map();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
      deviceScaleFactor: 1,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.route('**/*', async (route) => {
      try {
        const requestUrl = new URL(route.request().url());

        if (!['http:', 'https:'].includes(requestUrl.protocol)) {
          await route.continue();
          return;
        }

        if (!hostnameChecks.has(requestUrl.hostname)) {
          hostnameChecks.set(
            requestUrl.hostname,
            assertPublicHostname(requestUrl.hostname).then(() => true).catch(() => false),
          );
        }

        const isAllowed = await hostnameChecks.get(requestUrl.hostname);
        if (!isAllowed) {
          await route.abort('blockedbyclient');
          return;
        }

        await route.continue();
      } catch {
        await route.abort('blockedbyclient');
      }
    });

    const response = await page.goto(targetUrl.toString(), {
      waitUntil: 'domcontentloaded',
      timeout: CAPTURE_TIMEOUT_MS,
    }).catch((error) => {
      throw getFriendlyBrowserError(error);
    });

    assertUsableResponse(response);

    await assertPublicHostname(new URL(page.url()).hostname);
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT_MS }).catch(() => {});

    if (await appearsLoginRequired(page)) {
      throw new WebsiteCaptureError('This page appears to require login before it can be analyzed.', 401);
    }

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'jpeg',
      quality: 82,
      timeout: CAPTURE_TIMEOUT_MS,
    });

    return createCapturedFile(screenshotPath, targetUrl.toString());
  } catch (error) {
    await fs.rm(screenshotPath, { force: true });
    throw error;
  } finally {
    await browser?.close();
  }
};
