import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AttributionData, AttributionService } from './attribution.service';
import { FootmarkApiService } from './footmark-api.service';

describe('FootmarkApiService storage retries', () => {
  let service: FootmarkApiService;
  let fetchSpy: jasmine.Spy;

  const attributionData: AttributionData = {
    initial_referrer: 'Direct',
    landing_page: '/',
    first_visit_time: new Date().toISOString(),
    last_visit_time: new Date().toISOString(),
    visit_count: 1,
  };

  function response(status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async function settleRequests(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);

    const attribution = jasmine.createSpyObj<AttributionService>('AttributionService', ['getAttribution']);
    attribution.getAttribution.and.returnValue(attributionData);

    TestBed.configureTestingModule({
      providers: [
        FootmarkApiService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AttributionService, useValue: attribution },
      ],
    });

    service = TestBed.inject(FootmarkApiService);
    fetchSpy = spyOn(window, 'fetch');
  });

  it('keeps failed page views queued and removes them after a successful retry', async () => {
    fetchSpy.and.returnValue(Promise.resolve(response(503, {
      success: false,
      source: 'mongodb',
      dbConnected: false,
    })));

    service.track('/retry-test');
    const queued = JSON.parse(localStorage.getItem('apk_pending_footmarks_v1') || '[]');
    expect(queued.length).toBe(1);
    await settleRequests();
    expect(JSON.parse(localStorage.getItem('apk_pending_footmarks_v1') || '[]').length).toBe(1);

    fetchSpy.and.returnValue(Promise.resolve(response(200, {
      success: true,
      source: 'mongodb',
      dbConnected: true,
    })));
    await service['flushPendingFootmarks']();
    await settleRequests();

    expect(fetchSpy.calls.count()).toBe(3);
    expect(JSON.parse(localStorage.getItem('apk_pending_footmarks_v1') || '[]')).toEqual([]);
  });

  it('uses the Netlify endpoint when the primary endpoint returns a non-server error', async () => {
    fetchSpy.and.returnValues(
      Promise.resolve(response(404, { success: false })),
      Promise.resolve(response(200, { success: true, source: 'mongodb', dbConnected: true })),
    );

    service.track('/fallback-test');
    await settleRequests();

    expect(fetchSpy.calls.count()).toBe(2);
    expect(fetchSpy.calls.argsFor(1)[0]).toBe('/.netlify/functions/footmark');
    expect(JSON.parse(localStorage.getItem('apk_pending_footmarks_v1') || '[]')).toEqual([]);
  });

  it('tries the durable endpoint after a primary server error', async () => {
    fetchSpy.and.returnValues(
      Promise.resolve(response(503, { success: false, source: 'mongodb' })),
      Promise.resolve(response(200, { success: true, source: 'mongodb', dbConnected: true })),
    );

    service.track('/primary-outage');
    await settleRequests();

    expect(fetchSpy.calls.count()).toBe(2);
    expect(fetchSpy.calls.argsFor(1)[0]).toBe('/.netlify/functions/footmark');
    expect(JSON.parse(localStorage.getItem('apk_pending_footmarks_v1') || '[]')).toEqual([]);
  });

  it('does not discard a queue item acknowledged only by a non-durable source', async () => {
    fetchSpy.and.returnValues(
      Promise.resolve(response(200, { success: true, source: 'local_store' })),
      Promise.resolve(response(200, { success: true, source: 'local_store' })),
    );

    service.track('/ephemeral-storage');
    await settleRequests();

    expect(fetchSpy.calls.count()).toBe(2);
    expect(JSON.parse(localStorage.getItem('apk_pending_footmarks_v1') || '[]').length).toBe(1);
  });
});
