import assert from 'node:assert/strict'
import test from 'node:test'
import { createContentForm, contentPayload } from '../src/utils/contentEditor.mjs'

test('editing a content never mutates the loaded list record', () => {
  const original = { id: 3, kind: 'guide', slug: 'acheter', title: 'Acheter', date: '2026-11-13', sections: [{ id: 'visite', title: 'Visite', paragraphs: ['Texte'], checklist: ['Vérifier'] }] }
  const draft = createContentForm(original)
  draft.sections[0].paragraphs[0] = 'Modification'
  draft.sections[0].checklist.push('Nouveau')
  assert.deepEqual(original.sections[0], { id: 'visite', title: 'Visite', paragraphs: ['Texte'], checklist: ['Vérifier'] })
})

test('submission keeps structured plain text and excludes server-managed fields', () => {
  const form = createContentForm({ id: 8, kind: 'legal', title: ' Confidentialité ', slug: 'confidentialite', date: '2026-11-13', status: 'published', is_provisional: true, sections: [{ id: 'usage', title: 'Usage', paragraphs: ['Premier paragraphe\navec un retour'], checklist: [] }] })
  const payload = contentPayload(form)
  assert.equal(payload.id, undefined)
  assert.equal(payload.title, 'Confidentialité')
  assert.equal(payload.is_provisional, true)
  assert.equal(payload.image, null)
  assert.deepEqual(payload.sections[0].paragraphs, ['Premier paragraphe\navec un retour'])
})
