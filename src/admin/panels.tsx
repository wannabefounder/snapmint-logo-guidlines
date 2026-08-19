import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { explain, updateSiteConfig, useTable, type Row } from './api'
import { Banner, Btn, EditForm, Field, Panel, RecordCard, type FieldDef } from './ui'

type Notify = (msg: string) => void

/* ------------------------------------------------------------ generic list */

function ListPanel({
  table,
  title,
  description,
  fields,
  newRow,
  addLabel,
  titleKey,
  subtitleKey,
  notify,
  filter,
}: {
  table: string
  title: string
  description: string
  fields: FieldDef[]
  newRow: () => Record<string, any>
  addLabel: string
  titleKey: string
  subtitleKey?: string
  notify: Notify
  filter?: { column: string; value: string | null }
}) {
  const t = useTable(table, filter)

  const add = async () => {
    if (await t.create(newRow())) notify('Added')
  }

  return (
    <Panel
      title={title}
      description={description}
      action={
        <Btn kind="solid" size="sm" onClick={add}>
          {addLabel}
        </Btn>
      }
    >
      {t.error && (
        <div className="mb-4">
          <Banner kind="error">{t.error}</Banner>
        </div>
      )}
      {t.loading ? (
        <p className="text-[13px] text-neutral-400">Loading…</p>
      ) : t.rows.length === 0 ? (
        <Banner kind="info">Nothing here yet. Use “{addLabel}” to create the first one.</Banner>
      ) : (
        <div className="space-y-2.5">
          {t.rows.map((r, i) => (
            <RecordCard
              key={r.id}
              title={String(r[titleKey] ?? '')}
              subtitle={subtitleKey ? String(r[subtitleKey] ?? '') : undefined}
              visible={r.visible}
              onVisible={async (v) => {
                if (await t.update(r.id, { visible: v })) notify(v ? 'Now visible' : 'Hidden from the site')
              }}
              onUp={i > 0 ? () => t.move(r.id, -1) : undefined}
              onDown={i < t.rows.length - 1 ? () => t.move(r.id, 1) : undefined}
              onDelete={async () => {
                if (await t.remove(r.id)) notify('Deleted')
              }}
            >
              <EditForm
                fields={fields}
                row={r}
                onSave={async (patch) => {
                  const ok = await t.update(r.id, patch)
                  if (ok) notify('Saved')
                  return ok
                }}
              />
            </RecordCard>
          ))}
        </div>
      )}
    </Panel>
  )
}

/* ------------------------------------------------------------ site config */

export function SitePanel({ notify }: { notify: Notify }) {
  const [row, setRow] = useState<Row | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const { data, error } = await supabase!.from('site_config').select('*').maybeSingle()
    if (error) setError(explain(error))
    else setRow(data as Row)
  }
  useEffect(() => {
    void load()
  }, [])

  const fields: FieldDef[] = [
    { key: 'brand_name', label: 'Brand name', help: 'Shown in the sidebar and the mobile title bar.' },
    { key: 'site_title', label: 'Site title', help: 'The line under the logo, e.g. “Logo guidelines”.' },
    { key: 'site_tagline', label: 'Tagline', type: 'textarea', span: 2 },
    { key: 'sidebar_note', label: 'Sidebar footer note', type: 'textarea', span: 2 },
    { key: 'footer_note', label: 'Page footer note', type: 'textarea', span: 2 },
  ]

  return (
    <Panel title="Site" description="Names and standing text that appear on every page.">
      {error && (
        <div className="mb-4">
          <Banner kind="error">{error}</Banner>
        </div>
      )}
      {!row ? (
        <p className="text-[13px] text-neutral-400">Loading…</p>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <EditForm
            fields={fields}
            row={row}
            onSave={async (patch) => {
              try {
                await updateSiteConfig(patch)
                await load()
                notify('Saved')
                return true
              } catch (e: any) {
                setError(e.message)
                return false
              }
            }}
          />
        </div>
      )}
    </Panel>
  )
}

/* ----------------------------------------------------------------- logos */

export function LogosPanel({ notify }: { notify: Notify }) {
  const fields: FieldDef[] = [
    { key: 'label', label: 'Name', help: 'e.g. Snapmint Orange' },
    { key: 'slug', label: 'Short name', help: 'Lowercase, no spaces. Used in filenames and preview folders.' },
    { key: 'rank_label', label: 'Rank label', placeholder: '1st preference' },
    { key: 'hex', label: 'Hex', type: 'color' },
    { key: 'use_note', label: 'When to use it', type: 'textarea', span: 2 },
    { key: 'svg_path', label: 'SVG file', type: 'asset', folder: 'logos', accept: 'image/svg+xml', span: 2 },
    { key: 'png_path', label: 'PNG file', type: 'asset', folder: 'logos', accept: 'image/png', span: 2 },
  ]
  return (
    <ListPanel
      table="logo_options"
      title="Logo options"
      description="Each option shows as a card on the Logo page and as a choice in the colour toggle. Hide one to remove it everywhere at once."
      fields={fields}
      titleKey="label"
      subtitleKey="hex"
      addLabel="Add logo"
      newRow={() => ({ slug: `logo-${Date.now().toString(36)}`, label: 'New logo', hex: '#FF6F00', visible: false })}
      notify={notify}
    />
  )
}

/* --------------------------------------------------------------- sections */

export function SectionsPanel({ notify }: { notify: Notify }) {
  const fields: FieldDef[] = [
    { key: 'nav_label', label: 'Sidebar label' },
    { key: 'eyebrow', label: 'Group heading', help: 'Sections sharing this text are grouped in the sidebar.' },
    { key: 'title', label: 'Page title', span: 2 },
    { key: 'description', label: 'Intro paragraph', type: 'textarea', span: 2 },
    { key: 'note_body', label: 'Callout box', type: 'textarea', span: 2, help: 'Leave empty to hide the grey note box.' },
    {
      key: 'kind', label: 'Layout', type: 'select',
      options: [
        { value: 'widget', label: 'Placement previews' },
        { value: 'logo', label: 'Logo cards' },
        { value: 'colours', label: 'Colour swatches' },
        { value: 'usage', label: 'Do & Don’t lists' },
      ],
    },
    { key: 'slug', label: 'URL name', help: 'Appears in the address bar after #/.' },
    { key: 'empty_title', label: 'Coming-soon heading' },
    { key: 'empty_body', label: 'Coming-soon text', type: 'textarea', span: 2 },
  ]

  const t = useTable('sections')

  return (
    <Panel
      title="Sections"
      description="Pages in the sidebar. Hide one to remove it from the site, or mark it coming soon to show the placeholder instead of previews."
      action={
        <Btn
          kind="solid"
          size="sm"
          onClick={async () => {
            const ok = await t.create({
              slug: `section-${Date.now().toString(36)}`,
              nav_label: 'New section',
              title: 'New section',
              eyebrow: 'Placements',
              kind: 'widget',
              visible: false,
            })
            if (ok) notify('Section added — it stays hidden until you turn it on')
          }}
        >
          Add section
        </Btn>
      }
    >
      {t.error && (
        <div className="mb-4">
          <Banner kind="error">{t.error}</Banner>
        </div>
      )}
      <div className="space-y-2.5">
        {t.rows.map((r, i) => (
          <RecordCard
            key={r.id}
            title={r.nav_label}
            subtitle={`#/${r.slug}`}
            visible={r.visible}
            onVisible={async (v) => {
              if (await t.update(r.id, { visible: v })) notify(v ? 'Now visible' : 'Hidden from the site')
            }}
            onUp={i > 0 ? () => t.move(r.id, -1) : undefined}
            onDown={i < t.rows.length - 1 ? () => t.move(r.id, 1) : undefined}
            onDelete={async () => {
              if (await t.remove(r.id)) notify('Deleted')
            }}
          >
            <label className="mb-4 flex items-center gap-2.5 text-[13px] text-neutral-600">
              <input
                type="checkbox"
                checked={!!r.is_coming_soon}
                onChange={async (e) => {
                  if (await t.update(r.id, { is_coming_soon: e.target.checked })) notify('Saved')
                }}
                className="h-4 w-4 accent-brand-orange"
              />
              Show the coming-soon placeholder instead of previews
            </label>
            <EditForm
              fields={fields}
              row={r}
              onSave={async (patch) => {
                const ok = await t.update(r.id, patch)
                if (ok) notify('Saved')
                return ok
              }}
            />
          </RecordCard>
        ))}
      </div>
    </Panel>
  )
}

/* ---------------------------------------------------------------- widgets */

export function WidgetsPanel({ notify }: { notify: Notify }) {
  const sections = useTable('sections')
  const [sectionId, setSectionId] = useState<string | null>(null)

  const placements = useMemo(() => sections.rows.filter((s) => s.kind === 'widget'), [sections.rows])

  useEffect(() => {
    if (!sectionId && placements.length) setSectionId(placements[0].id)
  }, [placements, sectionId])

  const groups = useTable('widget_groups', { column: 'section_id', value: sectionId })

  return (
    <Panel
      title="Widgets"
      description="Groups and the previews inside them. Order here is the order merchants see, so keep it matching the Gold Standard board."
      action={
        <Btn
          kind="solid"
          size="sm"
          disabled={!sectionId}
          onClick={async () => {
            if (await groups.create({ section_id: sectionId, title: 'New group', visible: false })) notify('Group added')
          }}
        >
          Add group
        </Btn>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {placements.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSectionId(s.id)}
            className={`tap rounded-lg border px-3 py-1.5 text-[13px] font-medium ${
              s.id === sectionId
                ? 'border-neutral-300 bg-neutral-100 text-ink'
                : 'border-neutral-200 bg-white text-neutral-500 hover:text-ink'
            }`}
          >
            {s.nav_label}
          </button>
        ))}
      </div>

      {groups.error && (
        <div className="mb-4">
          <Banner kind="error">{groups.error}</Banner>
        </div>
      )}

      {groups.rows.length === 0 ? (
        <Banner kind="info">
          No groups in this section yet. Add one, then add the individual previews inside it.
        </Banner>
      ) : (
        <div className="space-y-2.5">
          {groups.rows.map((g, i) => (
            <RecordCard
              key={g.id}
              title={g.title}
              subtitle={g.blurb}
              visible={g.visible}
              onVisible={async (v) => {
                if (await groups.update(g.id, { visible: v })) notify(v ? 'Now visible' : 'Hidden from the site')
              }}
              onUp={i > 0 ? () => groups.move(g.id, -1) : undefined}
              onDown={i < groups.rows.length - 1 ? () => groups.move(g.id, 1) : undefined}
              onDelete={async () => {
                if (await groups.remove(g.id)) notify('Group and its previews deleted')
              }}
            >
              <EditForm
                fields={[
                  { key: 'title', label: 'Group name' },
                  { key: 'blurb', label: 'Group description', type: 'textarea', span: 2 },
                ]}
                row={g}
                onSave={async (patch) => {
                  const ok = await groups.update(g.id, patch)
                  if (ok) notify('Saved')
                  return ok
                }}
              />
              <div className="mt-6 border-t border-neutral-100 pt-5">
                <ItemsEditor groupId={g.id} notify={notify} />
              </div>
            </RecordCard>
          ))}
        </div>
      )}
    </Panel>
  )
}

function ItemsEditor({ groupId, notify }: { groupId: string; notify: Notify }) {
  const items = useTable('widget_items', { column: 'group_id', value: groupId })
  const logos = useTable('logo_options')

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-ink">Previews in this group</h4>
        <Btn
          size="sm"
          onClick={async () => {
            if (await items.create({ group_id: groupId, name: 'New preview', visible: false })) notify('Preview added')
          }}
        >
          Add preview
        </Btn>
      </div>

      {items.error && (
        <div className="mb-3">
          <Banner kind="error">{items.error}</Banner>
        </div>
      )}

      {items.rows.length === 0 ? (
        <p className="text-[12px] text-neutral-400">No previews yet.</p>
      ) : (
        <div className="space-y-2">
          {items.rows.map((it, i) => (
            <RecordCard
              key={it.id}
              title={it.name}
              subtitle={it.spec}
              visible={it.visible}
              onVisible={async (v) => {
                if (await items.update(it.id, { visible: v })) notify(v ? 'Now visible' : 'Hidden from the site')
              }}
              onUp={i > 0 ? () => items.move(it.id, -1) : undefined}
              onDown={i < items.rows.length - 1 ? () => items.move(it.id, 1) : undefined}
              onDelete={async () => {
                if (await items.remove(it.id)) notify('Deleted')
              }}
            >
              <EditForm
                fields={[
                  { key: 'name', label: 'Preview name' },
                  { key: 'cta', label: 'Button text' },
                  { key: 'spec', label: 'Spec line', type: 'textarea', span: 2 },
                  {
                    key: 'asset_key', label: 'Artwork name', span: 2,
                    help: 'Loads /assets/widgets/preview/<colour>/<name>.svg. Leave as-is unless you upload custom art below.',
                  },
                  { key: 'width', label: 'Artwork width', type: 'number' },
                  { key: 'height', label: 'Artwork height', type: 'number' },
                ]}
                row={it}
                onSave={async (patch) => {
                  const ok = await items.update(it.id, patch)
                  if (ok) notify('Saved')
                  return ok
                }}
              />

              <div className="mt-5 border-t border-neutral-100 pt-4">
                <p className="mb-2.5 text-[12px] font-medium text-neutral-600">Custom artwork per colour</p>
                <p className="mb-3 text-[11px] leading-relaxed text-neutral-400">
                  Optional. Upload a file to override the automatic artwork for one colour only.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {logos.rows.map((l) => (
                    <Field
                      key={l.id}
                      def={{
                        key: `ov-${l.slug}`,
                        label: l.label,
                        type: 'asset',
                        folder: `widgets/${l.slug}`,
                        accept: 'image/svg+xml,image/png',
                      }}
                      value={it.preview_overrides?.[l.slug] ?? ''}
                      onChange={async (v) => {
                        const next = { ...(it.preview_overrides ?? {}) }
                        if (v) next[l.slug] = v
                        else delete next[l.slug]
                        if (await items.update(it.id, { preview_overrides: next })) notify('Artwork updated')
                      }}
                    />
                  ))}
                </div>
              </div>
            </RecordCard>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- colours */

export function ColoursPanel({ notify }: { notify: Notify }) {
  return (
    <ListPanel
      table="colours"
      title="Colours"
      description="The palette table on the Colours page."
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'hex', label: 'Hex', type: 'color' },
        { key: 'usage', label: 'Where it’s used', type: 'textarea', span: 2 },
      ]}
      titleKey="name"
      subtitleKey="hex"
      addLabel="Add colour"
      newRow={() => ({ name: 'New colour', hex: '#000000', usage: '', visible: false })}
      notify={notify}
    />
  )
}

/* ------------------------------------------------------------------ rules */

export function RulesPanel({ notify }: { notify: Notify }) {
  return (
    <ListPanel
      table="rules"
      title="Rules"
      description="“Logo” rules show as the three-column strip under the logo cards. “Do” and “Don’t” fill the checklist page."
      fields={[
        {
          key: 'kind', label: 'Type', type: 'select',
          options: [
            { value: 'logo', label: 'Logo rule (three-column strip)' },
            { value: 'do', label: 'Do' },
            { value: 'dont', label: 'Don’t' },
          ],
        },
        { key: 'title', label: 'Heading', help: 'Used by logo rules only.' },
        { key: 'body', label: 'Text', type: 'textarea', span: 2 },
      ]}
      titleKey="body"
      subtitleKey="kind"
      addLabel="Add rule"
      newRow={() => ({ kind: 'do', title: '', body: 'New rule', visible: false })}
      notify={notify}
    />
  )
}

/* --------------------------------------------------------------- activity */

export function ActivityPanel() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase!
        .from('audit_log')
        .select('*')
        .order('at', { ascending: false })
        .limit(100)
      if (error) setError(explain(error))
      else setRows(data ?? [])
    })()
  }, [])

  const label: Record<string, string> = { INSERT: 'Added', UPDATE: 'Changed', DELETE: 'Deleted' }
  const entity: Record<string, string> = {
    site_config: 'site settings', logo_options: 'a logo option', sections: 'a section',
    widget_groups: 'a widget group', widget_items: 'a preview', colours: 'a colour', rules: 'a rule',
  }

  return (
    <Panel title="Activity" description="The last 100 changes made through this panel.">
      {error && <Banner kind="error">{error}</Banner>}
      {!error && rows.length === 0 && <Banner kind="info">No changes recorded yet.</Banner>}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-[13px] ${
                i > 0 ? 'border-t border-neutral-100' : ''
              }`}
            >
              <span className="font-medium text-ink">{label[r.action] ?? r.action}</span>
              <span className="text-neutral-500">{entity[r.entity] ?? r.entity}</span>
              <span className="ml-auto text-[12px] text-neutral-400">
                {new Date(r.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
