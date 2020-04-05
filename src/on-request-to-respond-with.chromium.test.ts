import { Browser, chromium, Request } from 'playwright';
import { FakeServer } from 'simple-fake-server';
import * as path from 'path';

describe('on request to respond with', (): void => {
  let browser: Browser | undefined = undefined;
  let fakeServer: FakeServer | undefined = undefined;
  beforeAll(() => {
    fakeServer = new FakeServer(1234);
    fakeServer.start();
    //The FakeServer now listens on http://localhost:1234
  });
  afterAll(() => {
    if (fakeServer) {
      fakeServer.stop();
    }
  });
  beforeEach((): void => {
    jest.setTimeout(60000);
  });
  afterEach(
    async (): Promise<void> => {
      if (browser) {
        await browser.close();
      }
    },
  );

  test('should mock response', async (): Promise<void> => {
    // Given I start a chromium instance
    browser = await chromium.launch({
      headless: true,
    });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    // Given the browser will call a web api at http://localhost:1234/foobar
    const responseBody = {
      prop1: 'foobar',
    };
    const responseHeaders = {
      'foo-header': 'bar',
    };
    fakeServer &&
      fakeServer.http
        .get()
        .to('/foobar')
        .willReturn(responseBody, 200, responseHeaders);

    // Given requests to /foobar are recorded
    const requests: Request[] = [];
    
    page.on('requestfinished', (request) => {
      const requestedUrl = request.url();
      if (requestedUrl && requestedUrl.includes('/foobar')) {
        requests.push(request);
        return;
      }
    });
    page.on('requestfailed', (request) => {
      const requestedUrl = request.url();
      if (requestedUrl && requestedUrl.includes('/foobar')) {
        requests.push(request);
        return;
      }
    });

    // When
    const mockedResponseBody = {
      prop1: 'mock-foobar',
    };

    await page.route(
      (uri) => {
        return uri.toString().includes('/foobar');
      },
      (route) => {
        route.fulfill({
          headers : {'foo-header': 'mock-bar'},
          contentType : 'application/json',
          status: 200,
          body: JSON.stringify(mockedResponseBody,null,2),
        });
      },
    );

    await page.goto(`file:${path.join(__dirname, 'on-request-to-respond-with.test.html')}`);
    await page.waitFor(3000);

    // Then
    expect(requests.length).toBe(1);
    const response = await requests[0].response();
    expect(response).not.toBeNull();
    const payload = await response!.json();
    expect(payload).toMatchObject(mockedResponseBody);
  });
});
