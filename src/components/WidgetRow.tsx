import { previewUrl, type LogoOption, type WidgetItem } from '../lib/content'

/**
 * One widget preview, laid out as a spec row: label column on the left,
 * the render on the right. No card, no hover motion — the widget's own
 * light-grey surface reads cleanly against the white page.
 */
export default function WidgetRow({ item, logo }: { item: WidgetItem; logo: LogoOption }) {
  return (
    <figure className="grid gap-4 border-t border-neutral-100 py-7 sm:grid-cols-[210px_1fr] sm:gap-10">
      <figcaption className="sm:pt-1">
        <p className="font-display text-[14px] font-semibold text-ink">{item.name}</p>
        {item.spec && <p className="mt-1 text-[13px] leading-snug text-neutral-500">{item.spec}</p>}
        {item.cta && <p className="mt-1.5 text-[12px] text-neutral-400">Button: {item.cta}</p>}
      </figcaption>

      <div className="min-w-0">
        <img
          src={previewUrl(item, logo.slug)}
          alt={`${item.name} widget — ${item.spec}`}
          loading="lazy"
          className="h-auto w-full max-w-[430px]"
          style={{ aspectRatio: `${item.width} / ${item.height}` }}
        />
      </div>
    </figure>
  )
}
