// directus/scripts/brevo-setup.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ATTRIBUTES, LISTS, envLines, planBrevoSetup, templateProblems } from './brevo-setup.mjs'

test('an empty account needs the folder, both lists and every attribute', () => {
  const plan = planBrevoSetup({ folders: [], lists: [], attributes: [] })
  assert.deepEqual(plan.folder, { name: 'PERMAPHEMERA', id: null })
  assert.deepEqual(plan.lists.map((l) => [l.name, l.id]), [['Newsletter DE', null], ['Newsletter EN', null]])
  assert.deepEqual(plan.attributes.map((a) => a.name), ATTRIBUTES.map((a) => a.name))
})

test('what exists is reused; names match without regard to case', () => {
  const plan = planBrevoSetup({
    folders: [{ id: 2, name: 'permaphemera' }],
    lists: [{ id: 7, name: 'Newsletter DE' }, { id: 9, name: 'Other' }],
    attributes: [{ name: 'NL_NAME', category: 'normal', type: 'text' }, { name: 'nl_topics', category: 'normal', type: 'text' }]
  })
  assert.deepEqual(plan.folder, { name: 'PERMAPHEMERA', id: 2 })
  assert.deepEqual(plan.lists.map((l) => [l.name, l.id]), [['Newsletter DE', 7], ['Newsletter EN', null]])
  assert.ok(!plan.attributes.some((a) => a.name === 'NL_NAME' || a.name === 'NL_TOPICS'))
  assert.ok(plan.attributes.some((a) => a.name === 'NL_TOWNS'))
})

test('an attribute of the wrong type is reported, not created again', () => {
  const plan = planBrevoSetup({ folders: [], lists: [], attributes: [{ name: 'NL_SIGNUP_DATE', category: 'normal', type: 'text' }] })
  assert.ok(!plan.attributes.some((a) => a.name === 'NL_SIGNUP_DATE'))
  assert.deepEqual(plan.conflicts, ['NL_SIGNUP_DATE is "text" in Brevo, needs "date"'])
})

test('the attribute set: one date, the rest text, all with the NL_ prefix', () => {
  assert.equal(ATTRIBUTES.find((a) => a.name === 'NL_SIGNUP_DATE').type, 'date')
  assert.ok(ATTRIBUTES.filter((a) => a.name !== 'NL_SIGNUP_DATE').every((a) => a.type === 'text'))
  assert.ok(ATTRIBUTES.every((a) => a.name.startsWith('NL_')))
  assert.deepEqual(LISTS.map((l) => l.language), ['de', 'en'])
})

test('the env lines name the lists and leave the templates to fill in', () => {
  assert.equal(envLines({ de: 3, en: 4 }, { de: null, en: 6 }), [
    'NEWSLETTER_LIST_DE=3',
    'NEWSLETTER_LIST_EN=4',
    'NEWSLETTER_TEMPLATE_DE=<id of the German DOI template>',
    'NEWSLETTER_TEMPLATE_EN=6'
  ].join('\n'))
})

test('a template must be active, a DOI template and sent from the newsletter address', () => {
  const good = { id: 5, isActive: true, doiTemplate: true, sender: { email: 'newsletter@permaphemera.at' }, htmlContent: '<a href="{{ doubleoptin }}">' }
  assert.deepEqual(templateProblems(good), [])
  assert.deepEqual(templateProblems({ ...good, isActive: false, doiTemplate: false, sender: { email: 'robertwildling@gmail.com' }, htmlContent: '<p>hi</p>' }), [
    'template 5 is not active',
    'template 5 is not a double opt-in template (tag "optin" missing)',
    'template 5 has no {{ doubleoptin }} link',
    'template 5 is sent from robertwildling@gmail.com, not newsletter@permaphemera.at'
  ])
})
