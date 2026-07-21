import test from 'node:test';
import assert from 'node:assert/strict';
import { isPoseDevToolsEnabled } from '../src/lib/pose/dev-tools-config.js';

test('pose developer tools require both a development build and an explicit true flag', () => {
  assert.equal(isPoseDevToolsEnabled({ development: true, configuredValue: 'true' }), true);
  assert.equal(isPoseDevToolsEnabled({ development: true, configuredValue: ' TRUE ' }), true);
  assert.equal(isPoseDevToolsEnabled({ development: true, configuredValue: 'false' }), false);
  assert.equal(isPoseDevToolsEnabled({ development: true }), false);
  assert.equal(isPoseDevToolsEnabled({ development: false, configuredValue: 'true' }), false);
});
