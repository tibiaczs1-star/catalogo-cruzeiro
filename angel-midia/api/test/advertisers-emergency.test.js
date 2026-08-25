import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdvertiser, validateMonth, summarizeFinancial } from '../src/services/advertisers.js';
import { validateEmergency } from '../src/routes/emergency.js';

test('validates advertiser and monthly commercial record without charging', () => {
  const advertiser=validateAdvertiser({ name: 'Mercado Central', contactName: 'Ana', phone: '68999999999', email: 'ana@mercado.test', notes: '', photoAssetId:'11111111-1111-4111-8111-111111111111', logoAssetId:'22222222-2222-4222-8222-222222222222' });
  assert.equal(advertiser.ok, true);
  assert.equal(advertiser.value.photoAssetId, '11111111-1111-4111-8111-111111111111');
  assert.equal(validateAdvertiser({ name: 'Mercado Central', photoAssetId: 'arquivo-invalido' }).ok, false);
  assert.equal(validateAdvertiser({ name: '' }).ok, false);
  assert.equal(validateMonth({ competence: '2026-08', monthlyAmount: 1500, status: 'paid', notes: 'Pago por Pix' }).value.amountCents, 150000);
  assert.equal(validateMonth({ competence: '08/2026', monthlyAmount: 10, status: 'paid', notes: '' }).ok, false);
});

test('summarizes confirmed displays and effective cost per impression', () => {
  const result = summarizeFinancial([{ advertiser_id: 'a', advertiser_name: 'Loja A', monthly_amount_cents: 10000, displays: 25 }]);
  assert.equal(result.totalDisplays, 25);
  assert.equal(result.totalAmountCents, 10000);
  assert.equal(result.advertisers[0].costPerDisplayCents, 400);
});

test('emergency requires a message or media and an explicit mode', () => {
  assert.equal(validateEmergency({ mode: 'message', title: 'ATENÇÃO', message: 'Fechamento imediato', assetId: null }).ok, true);
  assert.equal(validateEmergency({ mode: 'media', title: '', message: '', assetId: '11111111-1111-4111-8111-111111111111' }).ok, true);
  assert.equal(validateEmergency({ mode: 'message', title: '', message: '', assetId: null }).ok, false);
});
