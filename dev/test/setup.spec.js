'use strict';

const chai = require('chai');
const chaiString = require('chai-string');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const knex = require('knex');
const DbCleaner = require('./db-cleaner');
const Magento2ApiClient = require('@emartech/magento2-api');

chai.use(chaiString);
chai.use(chaiSubset);
chai.use(sinonChai);
global.expect = chai.expect;

const createCustomer = (magentoApi, db) => async customer => {
  await magentoApi.post({ path: '/index.php/rest/V1/customers', payload: { customer } });

  const { entity_id: entityId } = await db
    .select('entity_id')
    .from('customer_entity')
    .where({ email: customer.email })
    .first();

  return Object.assign({}, customer, { entityId });
};

const createProduct = magentoApi => async product => {
  await magentoApi.post({ path: '/index.php/rest/V1/products', payload: { product } });

  return product;
};

const deleteProduct = magentoApi => async product => {
  await magentoApi.delete({ path: `/index.php/rest/V1/products/${product.sku}` });

  return product;
};

before(async function() {
  this.timeout(10000);
  this.db = knex({
    client: 'mysql',
    connection: {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    }
  });

  const result = await this.db
    .select('value')
    .from('core_config_data')
    .where({ path: 'emartech/emarsys/connecttoken' })
    .first();

  const { token } = JSON.parse(Buffer.from(result.value, 'base64'));
  this.token = token;

  this.magentoApi = new Magento2ApiClient({
    baseUrl: 'http://web',
    token: this.token
  });

  this.createCustomer = createCustomer(this.magentoApi, this.db);
  this.createProduct = createProduct(this.magentoApi);

  this.customer = await this.createCustomer({
    group_id: 0,
    dob: '1977-11-12',
    email: 'default@yolo.net',
    firstname: 'Yolo',
    lastname: 'Default',
    store_id: 1,
    website_id: 1,
    disable_auto_group_change: 0
  });

  this.deleteProduct = deleteProduct(this.magentoApi);

  this.product = await this.createProduct({
    sku: 'DEFAULT-SKU',
    name: 'Default product',
    price: 69.0,
    status: 1,
    visibility: 4,
    type_id: 'simple',
    attribute_set_id: 4,
    weight: 1,
    extension_attributes: {
      stock_item: {
        stock_id: 1,
        qty: 999,
        is_in_stock: 1
      }
    }
  });
});

after(async function() {
  await this.deleteProduct(this.product);
  await DbCleaner.create(this.db).tearDown();
});

beforeEach(async function() {
  this.sinon = sinon;
  this.sandbox = sinon.createSandbox();
});

afterEach(async function() {
  this.sandbox.restore();
  await DbCleaner.create(this.db).resetEmarsysData();
});
