// Explicit writable fields keep server metadata out of create/update requests.
export const createContentForm = (entry = {}) => ({
  kind: entry.kind ?? 'article',
  slug: entry.slug ?? '',
  title: entry.title ?? '',
  summary: entry.summary ?? '',
  category: entry.category ?? '',
  date: entry.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  image: entry.image ?? '',
  status: entry.status ?? 'draft',
  is_provisional: entry.is_provisional ?? false,
  sections: entry.sections?.map(section => ({
    id: section.id,
    title: section.title,
    paragraphs: [...(section.paragraphs ?? [])],
    checklist: [...(section.checklist ?? [])],
  })) ?? [{ id: 'introduction', title: '', paragraphs: [''], checklist: [] }],
})

export const contentPayload = form => ({
  ...createContentForm(form),
  slug: form.slug.trim(),
  title: form.title.trim(),
  summary: form.summary.trim(),
  category: form.category.trim() || null,
  image: form.image.trim() || null,
  sections: form.sections.map(section => ({
    id: section.id.trim(),
    title: section.title.trim(),
    paragraphs: section.paragraphs.map(text => text.trim()),
    checklist: section.checklist.map(text => text.trim()),
  })),
})
