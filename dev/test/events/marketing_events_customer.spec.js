'use strict';

const customer = {
  group_id: 0,
  dob: '1977-11-12',
  email: 'yolo@yolo.net',
  firstname: 'Yolo',
  lastname: 'World',
  store_id: 1,
  website_id: 1,
  disable_auto_group_change: 0
};

const newsletterCustomer = {
  group_id: 0,
  dob: '1977-11-12',
  email: 'yolo@newsletter.net',
  firstname: 'Yolo',
  lastname: 'Newsletter',
  store_id: 1,
  website_id: 1,
  disable_auto_group_change: 0
};

const resetPasswordResetRequestEvent = async db => {
  return await db.truncate('password_reset_request_event');
};

describe('Marketing events: customer', function() {
  afterEach(async function() {
    await resetPasswordResetRequestEvent(this.db);
    await this.db.raw('DELETE FROM customer_entity where email = "yolo@yolo.net"');
    await this.db.raw('DELETE FROM emarsys_events');
  });

  after(async function() {
    await this.db.raw('DELETE FROM newsletter_subscriber');
    await this.db.raw(
      'DELETE FROM customer_entity where email = "yolo@yolo.net" AND WHERE email = "yolo@newsletter.net"'
    );
  });

  context('if collectMarketingEvents turned off', function() {
    before(async function() {
      await this.magentoApi.setDefaultConfig(1);
    });

    it('it should NOT create customer_new_account_registered_no_password event', async function() {
      await this.magentoApi.setDefaultConfig(1);

      await this.createCustomer(customer);

      const event = await this.db
        .select()
        .from('emarsys_events')
        .where({ event_type: 'customer_new_account_registered_no_password' })
        .first();

      expect(event).to.be.undefined;
    });

    it('it should NOT create customer_new_account_registered event', async function() {
      await this.magentoApi.setDefaultConfig(1);

      await this.createCustomer(customer, 'Password1234');

      const event = await this.db
        .select()
        .from('emarsys_events')
        .where({ event_type: 'customer_new_account_registered' })
        .first();

      expect(event).to.be.undefined;
    });

    it('it should NOT create customer_password_reset_confirmation event', async function() {
      await this.magentoApi.setDefaultConfig(1);

      await this.magentoApi.put({
        path: '/index.php/rest/V1/customers/password',
        payload: {
          email: this.customer.email,
          template: 'email_reset',
          websiteId: this.customer.website_id
        }
      });

      const event = await this.db
        .select()
        .from('emarsys_events')
        .where({ event_type: 'customer_password_reset_confirmation' })
        .first();

      expect(event).to.be.undefined;
    });

    it('it should NOT create customer_password_reminder event', async function() {
      await this.magentoApi.setDefaultConfig(1);

      await this.magentoApi.put({
        path: '/index.php/rest/V1/customers/password',
        payload: {
          email: this.customer.email,
          template: 'email_reminder',
          websiteId: this.customer.website_id
        }
      });

      const event = await this.db
        .select()
        .from('emarsys_events')
        .where({ event_type: 'customer_password_reminder' })
        .first();

      expect(event).to.be.undefined;
    });

    context('and if newsletter/subscription/confirm', function() {
      let subscriber;

      before(async function() {
        subscriber = await this.createCustomer(newsletterCustomer, 'abcD1234');
      });

      beforeEach(async function() {
        await this.db.raw('DELETE FROM newsletter_subscriber');
        await this.db.raw('DELETE FROM emarsys_events');
      });

      after(async function() {
        await this.db.raw('DELETE FROM core_config_data WHERE path="newsletter/subscription/confirm"');
        await this.db.raw('DELETE FROM newsletter_subscriber');
        await this.db.raw('DELETE FROM customer_entity WHERE email="yolo@newsletter.net"');
      });

      context('is disabled', function() {
        it('should NOT create newsletter_send_confirmation_success_email event', async function() {
          await this.db.raw('DELETE FROM core_config_data WHERE path="newsletter/subscription/confirm"');
          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          const event = await this.db
            .select()
            .from('emarsys_events')
            .first();

          expect(event).to.be.undefined;
        });

        it('should NOT create newsletter_send_unsubscription_email event', async function() {
          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          await this.db.raw('DELETE FROM emarsys_events');

          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: false
                }
              }
            }
          });

          const event = await this.db
            .select()
            .from('emarsys_events')
            .first();

          expect(event).to.be.undefined;
        });
      });

      context('is enabled', function() {
        it('should create newsletter_send_confirmation_request_email event', async function() {
          await this.db
            .insert({ scope: 'default', scope_id: 0, path: 'newsletter/subscription/confirm', value: 1 })
            .into('core_config_data');

          // this is for invalidating config cache
          await this.magentoApi.setConfig({
            websiteId: 1,
            config: {
              collectMarketingEvents: 'disbaled'
            }
          });

          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          const event = await this.db
            .select()
            .from('emarsys_events')
            .first();

          expect(event).to.be.undefined;
        });

        it('should create newsletter_send_unsubscription_email event', async function() {
          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          await this.db.raw('DELETE FROM emarsys_events');

          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: false
                }
              }
            }
          });

          const event = await this.db
            .select()
            .from('emarsys_events')
            .first();

          expect(event).to.be.undefined;
        });
      });

      it('should create newsletter_send_unsubscription_email event', async function() {
        await this.magentoApi.put({
          path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
          payload: {
            customer: {
              id: subscriber.entityId,
              email: subscriber.email,
              firstname: subscriber.firstname,
              lastname: subscriber.lastname,
              store_id: 1,
              website_id: 1,
              extension_attributes: {
                is_subscribed: true
              }
            }
          }
        });

        await this.db.raw('DELETE FROM emarsys_events');

        await this.magentoApi.put({
          path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
          payload: {
            customer: {
              id: subscriber.entityId,
              email: subscriber.email,
              firstname: subscriber.firstname,
              lastname: subscriber.lastname,
              store_id: 1,
              website_id: 1,
              extension_attributes: {
                is_subscribed: false
              }
            }
          }
        });

        const event = await this.db
          .select()
          .from('emarsys_events')
          .first();

        expect(event).to.be.undefined;
      });
    });
  });

  context('if collectMarketingEvents turned on', function() {
    before(async function() {
      await this.magentoApi.setConfig({ websiteId: 1, config: { collectMarketingEvents: 'enabled' } });
    });

    it('it should create customer_new_account_registered_no_password event', async function() {
      await this.createCustomer(customer);

      const events = await this.db.select().from('emarsys_events');

      expect(events.length).to.be.equal(1);

      const event = events[0];
      expect(event.event_type).to.be.equal('customer_new_account_registered_no_password');

      const eventData = JSON.parse(event.event_data);
      expect(eventData.customer.email).to.eql(customer.email);
    });

    it('it should create customer_new_account_registered event', async function() {
      await this.createCustomer(customer, 'Password1234');

      const events = await this.db.select().from('emarsys_events');

      expect(events.length).to.be.equal(1);

      const event = events[0];
      expect(event.event_type).to.be.equal('customer_new_account_registered');

      const eventData = JSON.parse(event.event_data);
      expect(eventData.customer.email).to.eql(customer.email);
    });

    it('it should create customer_password_reset_confirmation event', async function() {
      await this.magentoApi.put({
        path: '/index.php/rest/V1/customers/password',
        payload: {
          email: this.customer.email,
          template: 'email_reset',
          websiteId: this.customer.website_id
        }
      });

      const events = await this.db.select().from('emarsys_events');

      expect(events.length).to.be.equal(1);

      const event = events[0];

      expect(event.event_type).to.be.equal('customer_password_reset_confirmation');

      const eventData = JSON.parse(event.event_data);
      expect(eventData.customer.email).to.equal(this.customer.email);
    });

    it('it should create customer_password_reminder event', async function() {
      await this.magentoApi.put({
        path: '/index.php/rest/V1/customers/password',
        payload: {
          email: this.customer.email,
          template: 'email_reminder',
          websiteId: this.customer.website_id
        }
      });

      const events = await this.db.select().from('emarsys_events');

      expect(events.length).to.be.equal(1);

      const event = events[0];

      expect(event.event_type).to.be.equal('customer_password_reminder');

      const eventData = JSON.parse(event.event_data);
      expect(eventData.customer.email).to.equal(this.customer.email);
    });

    context('and if newsletter/subscription/confirm', function() {
      let subscriber;

      before(async function() {
        subscriber = await this.createCustomer(newsletterCustomer, 'abcD1234');
      });

      beforeEach(async function() {
        await this.db.raw('DELETE FROM newsletter_subscriber');
        await this.db.raw('DELETE FROM emarsys_events');
      });

      after(async function() {
        await this.db.raw('DELETE FROM core_config_data WHERE path="newsletter/subscription/confirm"');
      });

      context('is disabled', function() {
        it('should create newsletter_send_confirmation_success_email event', async function() {
          await this.db.raw('DELETE FROM core_config_data WHERE path="newsletter/subscription/confirm"');
          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          const { event_type: createdEventType, event_data: data } = await this.db
            .select()
            .from('emarsys_events')
            .first();
          const createdEventData = JSON.parse(data);

          expect(createdEventType).to.equal('newsletter_send_confirmation_success_email');
          expect(createdEventData.subscriber.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.subscriber.subscriber_status).to.equal(1);
          expect(createdEventData.confirmation_link.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.confirmation_link.subscriber_status).to.equal(1);
          expect(createdEventData.customer.firstname).to.equal(subscriber.firstname);
          expect(createdEventData.customer.lastname).to.equal(subscriber.lastname);
        });

        it('should create newsletter_send_unsubscription_email event', async function() {
          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          await this.db.raw('DELETE FROM emarsys_events');

          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: false
                }
              }
            }
          });

          const { event_type: createdEventType, event_data: data } = await this.db
            .select()
            .from('emarsys_events')
            .first();
          const createdEventData = JSON.parse(data);

          expect(createdEventType).to.equal('newsletter_send_unsubscription_email');
          expect(createdEventData.subscriber.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.subscriber.subscriber_status).to.equal(3);
          expect(createdEventData.confirmation_link.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.confirmation_link.subscriber_status).to.equal(3);
          expect(createdEventData.customer.firstname).to.equal(subscriber.firstname);
          expect(createdEventData.customer.lastname).to.equal(subscriber.lastname);
        });
      });

      context('is enabled', function() {
        it('should create newsletter_send_confirmation_request_email event', async function() {
          await this.db
            .insert({ scope: 'default', scope_id: 0, path: 'newsletter/subscription/confirm', value: 1 })
            .into('core_config_data');

          // this is for invalidating config cache
          await this.magentoApi.setConfig({
            websiteId: 1,
            config: {
              collectMarketingEvents: 'enabled'
            }
          });

          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          const { event_type: createdEventType, event_data: data } = await this.db
            .select()
            .from('emarsys_events')
            .first();
          const createdEventData = JSON.parse(data);

          expect(createdEventType).to.equal('newsletter_send_confirmation_request_email');
          expect(createdEventData.subscriber.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.subscriber.subscriber_status).to.equal(2);
          expect(createdEventData.confirmation_link.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.confirmation_link.subscriber_status).to.equal(2);
          expect(createdEventData.customer.firstname).to.equal(subscriber.firstname);
          expect(createdEventData.customer.lastname).to.equal(subscriber.lastname);
        });

        // bug: sends newsletter_send_confirmation_request_email on unsubscribe
        it.skip('should create newsletter_send_unsubscription_email event', async function() {
          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: true
                }
              }
            }
          });

          await this.db.raw('DELETE FROM emarsys_events');

          await this.magentoApi.put({
            path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
            payload: {
              customer: {
                id: subscriber.entityId,
                email: subscriber.email,
                firstname: subscriber.firstname,
                lastname: subscriber.lastname,
                store_id: 1,
                website_id: 1,
                extension_attributes: {
                  is_subscribed: false
                }
              }
            }
          });

          const { event_type: createdEventType, event_data: data } = await this.db
            .select()
            .from('emarsys_events')
            .first();
          const createdEventData = JSON.parse(data);

          expect(createdEventType).to.equal('newsletter_send_unsubscription_email');
          expect(createdEventData.subscriber.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.subscriber.subscriber_status).to.equal(3);
          expect(createdEventData.confirmation_link.subscriber_email).to.equal(subscriber.email);
          expect(createdEventData.confirmation_link.subscriber_status).to.equal(3);
          expect(createdEventData.customer.firstname).to.equal(subscriber.firstname);
          expect(createdEventData.customer.lastname).to.equal(subscriber.lastname);
        });
      });

      it('should create newsletter_send_unsubscription_email event', async function() {
        await this.magentoApi.put({
          path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
          payload: {
            customer: {
              id: subscriber.entityId,
              email: subscriber.email,
              firstname: subscriber.firstname,
              lastname: subscriber.lastname,
              store_id: 1,
              website_id: 1,
              extension_attributes: {
                is_subscribed: true
              }
            }
          }
        });

        await this.db.raw('DELETE FROM emarsys_events');

        await this.magentoApi.put({
          path: `/index.php/rest/V1/customers/${subscriber.entityId}`,
          payload: {
            customer: {
              id: subscriber.entityId,
              email: subscriber.email,
              firstname: subscriber.firstname,
              lastname: subscriber.lastname,
              store_id: 1,
              website_id: 1,
              extension_attributes: {
                is_subscribed: false
              }
            }
          }
        });

        const { event_type: createdEventType, event_data: data } = await this.db
          .select()
          .from('emarsys_events')
          .first();
        const createdEventData = JSON.parse(data);

        expect(createdEventType).to.equal('newsletter_send_unsubscription_email');
        expect(createdEventData.subscriber.subscriber_email).to.equal(subscriber.email);
        expect(createdEventData.subscriber.subscriber_status).to.equal(3);
        expect(createdEventData.confirmation_link.subscriber_email).to.equal(subscriber.email);
        expect(createdEventData.confirmation_link.subscriber_status).to.equal(3);
        expect(createdEventData.customer.firstname).to.equal(subscriber.firstname);
        expect(createdEventData.customer.lastname).to.equal(subscriber.lastname);
      });
    });
  });

  context.skip('customer_email_changed', function() {
    it('should create an event if collectMarketingEvents turned on', async function() {
      await this.magentoApi.setConfig({ websiteId: 1, config: { collectMarketingEvents: 'enabled' } });

      const newEmailAddress = 'passwordChangeOnTest@yolo.net';
      await this.magentoApi.put({
        path: `/index.php/rest/V1/customers/${this.customer.entityId}`,
        payload: {
          customer: {
            email: newEmailAddress,
            id: this.customer.entityId,
            firstname: this.customer.firstname,
            lastname: this.customer.lastname,
            websiteId: this.customer.website_id
          },
          password: this.customer.password
        }
      });

      const events = await this.db.select().from('emarsys_events');

      expect(events.length).to.be.equal(1);

      const event = events[0];

      expect(event.event_type).to.be.equal('customer_email_change');

      const eventData = JSON.parse(event.event_data);
      expect(eventData.customer.email).to.equal(newEmailAddress);
      this.customer.email = newEmailAddress;
    });

    it('should not create an event if collectMarketingEvents turned off', async function() {
      await this.magentoApi.setDefaultConfig(1);

      const newEmailAddress = 'passwordChangeOffTest@yolo.net';
      await this.magentoApi.put({
        path: `/index.php/rest/V1/customers/${this.customer.entityId}`,
        payload: {
          customer: {
            email: newEmailAddress,
            id: this.customer.entityId,
            firstname: this.customer.firstname,
            lastname: this.customer.lastname,
            websiteId: this.customer.website_id
          },
          password: this.customer.password
        }
      });

      const event = await this.db
        .select()
        .from('emarsys_events')
        .where({ event_type: 'customer_email_change' })
        .first();

      expect(event).to.be.undefined;
      this.customer.email = newEmailAddress;
    });
  });

  context.skip('customer_email_and_password_changed', function() {
    it('should create customer_email_and_password_changed event', async function() {
      //code
    });
  });

  context.skip('customer_password_reset', function() {
    afterEach(async function() {
      await resetPasswordResetRequestEvent(this.db);
    });

    it('should create an event if collectMarketingEvents turned on', async function() {
      await this.magentoApi.setConfig({ websiteId: 1, config: { collectMarketingEvents: 'enabled' } });

      const newPassword = 'Almafa1234';
      await this.magentoApi.put({
        path: `/index.php/rest/V1/customers/me/password?customerId=${this.customer.entityId}`,
        payload: {
          currentPassword: this.customer.password,
          newPassword
        }
      });

      const events = await this.db.select().from('emarsys_events');

      expect(events.length).to.be.equal(1);

      const event = events[0];

      expect(event.event_type).to.be.equal('customer_password_reset');

      const eventData = JSON.parse(event.event_data);
      expect(eventData.customer.email).to.equal(this.customer.email);
      this.customer.password = newPassword;
    });

    it('should not create an event if collectMarketingEvents turned off', async function() {
      await this.magentoApi.setDefaultConfig(1);

      const newPassword = 'Almafa4567';
      await this.magentoApi.put({
        path: `/index.php/rest/V1/customers/me/password?customerId=${this.customer.entityId}`,
        payload: {
          currentPassword: this.customer.password,
          newPassword
        }
      });

      const event = await this.db
        .select()
        .from('emarsys_events')
        .where({ event_type: 'customer_password_reset' })
        .first();

      expect(event).to.be.undefined;
      this.customer.password = newPassword;
    });
  });
});
