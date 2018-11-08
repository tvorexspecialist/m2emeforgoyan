'use strict';

const customer = {
  group_id: 0,
  dob: '1977-11-12',
  email: 'yolo99@yolo.net',
  firstname: 'Yolo',
  lastname: 'World',
  store_id: 1,
  website_id: 1,
  disable_auto_group_change: 0
};

describe('Customer events', function() {
  afterEach(async function() {
    await this.db.raw('DELETE FROM customer_entity where email = "yolo99@yolo.net"');
    await this.magentoApi.execute('config', 'setDefault', 1);
  });

  it('are saved in DB if collectCustomerEvents is enabled', async function() {
    await this.magentoApi.execute('config', 'set', { websiteId: 1, config: { collectCustomerEvents: 'enabled' } });
    await this.createCustomer(customer);

    const event = await this.db
      .select()
      .from('emarsys_events_data')
      .where({ event_type: 'customers/update' })
      .first();

    const eventData = JSON.parse(event.event_data);
    expect(eventData.email).to.eql(customer.email);
    expect(event.website_id).to.equal(1);
    expect(event.store_id).to.equal(1);
  });

  it('are not saved in DB if collectCustomerEvents is disabled', async function() {
    await this.magentoApi.execute('config', 'setDefault', 1);

    await this.createCustomer(customer);

    const event = await this.db
      .select()
      .from('emarsys_events_data')
      .where({ event_type: 'customers/update' })
      .first();

    expect(event).to.be.undefined;
  });
});
