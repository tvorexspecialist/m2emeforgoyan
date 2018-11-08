'use strict';

const customers = [
  {
    group_id: 0,
    dob: '1977-11-12',
    email: 'yolo@yolo.net',
    firstname: 'Yolo',
    lastname: 'World',
    store_id: 1,
    website_id: 1,
    disable_auto_group_change: 0
  },
  {
    group_id: 0,
    dob: '1977-11-12',
    email: 'doggo@yolo.net',
    firstname: 'Doggo',
    lastname: 'World',
    store_id: 1,
    website_id: 1,
    disable_auto_group_change: 0
  },
  {
    group_id: 0,
    dob: '1977-11-12',
    email: 'pupper@yolo.net',
    firstname: 'Pupper',
    lastname: 'World',
    store_id: 1,
    website_id: 1,
    disable_auto_group_change: 0
  }
];

describe('Events API endpoint', function() {
  afterEach(async function() {
    await this.db.raw(
      'DELETE FROM customer_entity where email in ("yolo@yolo.net", "doggo@yolo.net", "pupper@yolo.net")'
    );
    await this.magentoApi.execute('config', 'setDefault', 1);
  });

  it('returns number of events defined in page_size and deletes events before since_id', async function() {
    const pageSize = 1;
    await this.magentoApi.execute('config', 'set', { websiteId: 1, config: { collectCustomerEvents: 'enabled' } });
    for (const customer of customers) {
      await this.createCustomer(customer);
    }

    const eventsResponse = await this.magentoApi.execute('events', 'getSinceId', { sinceId: 0, pageSize });

    expect(eventsResponse.events.length).to.equal(pageSize);
    expect(eventsResponse.lastPage).to.equal(3);

    let sinceId = eventsResponse.events.pop().event_id;

    const secondEventsResponse = await this.magentoApi.execute('events', 'getSinceId', { sinceId, pageSize });

    expect(secondEventsResponse.lastPage).to.equal(2);

    const eventsInDb = await this.db.select().from('emarsys_events_data');
    expect(eventsInDb.length).to.equal(2);
    const firstEvent = eventsInDb[0];
    expect(firstEvent.website_id).to.equal(1);
    expect(firstEvent.store_id).to.equal(1);
  });
});
